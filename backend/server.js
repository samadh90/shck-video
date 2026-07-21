require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const compression = require('compression');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_shck_video';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
  }
}));

// Dossiers uploads s'ils n'existent pas
const videoUploadDir = path.join(__dirname, 'uploads/videos');
const thumbUploadDir = path.join(__dirname, 'uploads/thumbnails');

if (!fs.existsSync(videoUploadDir)) {
  fs.mkdirSync(videoUploadDir, { recursive: true });
}
if (!fs.existsSync(thumbUploadDir)) {
  fs.mkdirSync(thumbUploadDir, { recursive: true });
}

// Configuration Multer pour les vidéos et les miniatures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'thumbnail') {
      cb(null, thumbUploadDir);
    } else {
      cb(null, videoUploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // Max 500MB
});

const uploadFields = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

// Middleware d'authentification facultative
function optionalAuthToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    req.user = err ? null : user;
    next();
  });
}

// Middleware d'authentification requise
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Accès refusé. Connectez-vous.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide ou expiré.' });
    req.user = user;
    next();
  });
}

const crypto = require('crypto');

function generateNanoId(length = 9) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

function calculateAge(birthdateStr) {
  if (!birthdateStr) return null;
  const birthDate = new Date(birthdateStr);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

async function backfillNanoIds() {
  try {
    const unassigned = await prisma.video.findMany({ where: { customId: null } });
    for (const v of unassigned) {
      await prisma.video.update({
        where: { id: v.id },
        data: { customId: generateNanoId(9) }
      });
    }
  } catch (err) {
    console.error('Erreur backfill NanoIDs:', err);
  }
}
backfillNanoIds();

async function findVideoByIdOrCustomId(idOrCustomId) {
  if (!idOrCustomId) return null;
  const strVal = String(idOrCustomId);
  let video = await prisma.video.findUnique({
    where: { customId: strVal }
  });
  if (!video) {
    const numId = parseInt(strVal, 10);
    if (!isNaN(numId)) {
      video = await prisma.video.findUnique({
        where: { id: numId }
      });
    }
  }
  return video;
}

// Helper pour créer une notification avec auto-exclusion & lien de redirection
async function createNotification(targetUserId, message, link = null, actorId = null) {
  try {
    if (actorId && actorId === targetUserId) return;

    await prisma.notification.create({
      data: {
        userId: targetUserId,
        message,
        link
      }
    });
  } catch (err) {
    console.error('Erreur notification:', err);
  }
}

// --- ROUTES AUTH & UTILISATEUR ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API opérationnelle' });
});

// Inscription
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Cet email est déjà utilisé.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(16).toString('hex');

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
        isVerified: false,
        verificationToken
      }
    });

    res.json({ success: true, message: 'Compte créé avec succès. Veuillez vérifier votre adresse email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription.' });
  }
});

// Connexion
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Identifiants incorrects.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Identifiants incorrects.' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        isVerified: user.isVerified,
        birthdate: user.birthdate,
        age: calculateAge(user.birthdate)
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
});

// Vérifier son adresse email
app.post('/api/auth/verify-email', authenticateToken, async (req, res) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { isVerified: true, verificationToken: null },
      select: { id: true, username: true, email: true, isVerified: true }
    });
    res.json({ success: true, message: 'Adresse email vérifiée avec succès !', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la vérification de l\'email.' });
  }
});

// Obtenir son propre profil
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, email: true, avatar: true, bio: true, isVerified: true, birthdate: true, createdAt: true }
    });
    const unreadNotifications = await prisma.notification.count({
      where: { userId: req.user.id, read: false }
    });
    const followersCount = await prisma.follow.count({
      where: { followingId: req.user.id }
    });
    const userAge = calculateAge(user.birthdate);
    res.json({ ...user, age: userAge, unreadNotifications, followersCount });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// Modifier son profil
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { username, bio, avatar, birthdate } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        username: username || undefined,
        bio: bio !== undefined ? bio : undefined,
        avatar: avatar || undefined,
        birthdate: birthdate !== undefined ? birthdate : undefined
      },
      select: { id: true, username: true, email: true, avatar: true, bio: true, isVerified: true, birthdate: true }
    });
    const userAge = calculateAge(updatedUser.birthdate);
    res.json({ success: true, user: { ...updatedUser, age: userAge } });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

// Liste des abonnements de l'utilisateur connecté (pour le carrousel sur la page d'accueil)
app.get('/api/users/subscriptions', authenticateToken, async (req, res) => {
  try {
    const follows = await prisma.follow.findMany({
      where: { followerId: req.user.id },
      include: {
        following: {
          select: { id: true, username: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    const channels = follows.map(f => f.following);
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des abonnements' });
  }
});

// Obtenir les infos d'une chaîne / profil créateur (PUBLIC - Confidentialité stricte des abonnés)
app.get('/api/users/:id/channel', optionalAuthToken, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true, avatar: true, bio: true, createdAt: true }
    });

    if (!targetUser) return res.status(404).json({ error: 'Chaîne introuvable' });

    const isOwner = req.user && req.user.id === targetUserId;
    const followersCount = isOwner ? await prisma.follow.count({ where: { followingId: targetUserId } }) : null;

    let isFollowing = false;
    let userRating = null;

    if (req.user) {
      const followRecord = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: req.user.id,
            followingId: targetUserId
          }
        }
      });
      isFollowing = !!followRecord;

      const ratingRecord = await prisma.rating.findUnique({
        where: {
          targetUserId_userId: {
            targetUserId,
            userId: req.user.id
          }
        }
      });
      if (ratingRecord) userRating = ratingRecord.stars;
    }

    const ratings = await prisma.rating.findMany({ where: { targetUserId } });
    const totalStars = ratings.reduce((acc, r) => acc + r.stars, 0);
    const avgRating = ratings.length > 0 ? (totalStars / ratings.length).toFixed(1) : '0.0';

    const videos = await prisma.video.findMany({
      where: { userId: targetUserId, visibility: 'PUBLIC' },
      include: { likes: true },
      orderBy: { createdAt: 'desc' }
    });

    const formattedVideos = videos.map(v => ({
      ...v,
      likesCount: v.likes.filter(l => l.isLike).length,
      dislikesCount: v.likes.filter(l => !l.isLike).length
    }));

    res.json({
      user: targetUser,
      followersCount,
      isFollowing,
      avgRating,
      totalRatings: ratings.length,
      userRating,
      videos: formattedVideos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la chaîne' });
  }
});

// Évaluer le profil d'un utilisateur
app.post('/api/users/:id/rate', authenticateToken, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { stars } = req.body;

    if (req.user.id === targetUserId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas noter votre propre profil.' });
    }

    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'La note doit être entre 1 et 5 étoiles.' });
    }

    await prisma.rating.upsert({
      where: {
        targetUserId_userId: {
          targetUserId,
          userId: req.user.id
        }
      },
      update: { stars },
      create: {
        targetUserId,
        userId: req.user.id,
        stars
      }
    });

    const ratings = await prisma.rating.findMany({ where: { targetUserId } });
    const totalStars = ratings.reduce((acc, r) => acc + r.stars, 0);
    const avgRating = (totalStars / ratings.length).toFixed(1);

    await createNotification(
      targetUserId,
      `⭐ ${req.user.username} a évalué votre chaîne (${stars}/5 étoiles) !`,
      `/user/${targetUserId}`,
      req.user.id
    );

    res.json({ success: true, avgRating, totalRatings: ratings.length, userRating: stars });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de l\'évaluation' });
  }
});

// Suivre / Ne plus suivre une chaîne
app.post('/api/users/:id/follow', authenticateToken, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    if (req.user.id === targetUserId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous suivre vous-même.' });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.id,
          followingId: targetUserId
        }
      }
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: { id: existingFollow.id }
      });
      return res.json({ isFollowing: false });
    } else {
      await prisma.follow.create({
        data: {
          followerId: req.user.id,
          followingId: targetUserId
        }
      });

      await createNotification(
        targetUserId,
        `🔔 ${req.user.username} s'est abonné à votre chaîne !`,
        `/user/${req.user.id}`,
        req.user.id
      );
      return res.json({ isFollowing: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du suivi' });
  }
});

// --- MOTEUR DE RECHERCHE MULTI-ENTITÉS ---

app.get('/api/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ channels: [], videos: [] });
    }

    const [channels, videos] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q } },
            { bio: { contains: q } }
          ]
        },
        select: { id: true, username: true, avatar: true, bio: true }
      }),
      prisma.video.findMany({
        where: {
          visibility: 'PUBLIC',
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { category: { contains: q } }
          ]
        },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          likes: true
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const formattedVideos = videos.map(v => ({
      ...v,
      likesCount: v.likes.filter(l => l.isLike).length,
      dislikesCount: v.likes.filter(l => !l.isLike).length
    }));

    res.json({ channels, videos: formattedVideos });
  } catch (error) {
    console.error('Erreur recherche:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
});

// --- ROUTES VIDÉOS ---

app.get('/api/videos', optionalAuthToken, async (req, res) => {
  try {
    const is18PlusRequested = req.query.is18Plus === 'true';

    let filterIs18Plus = false;
    if (is18PlusRequested && req.user) {
      const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (currentUser && calculateAge(currentUser.birthdate) >= 18) {
        filterIs18Plus = true;
      }
    }

    const videos = await prisma.video.findMany({
      where: { 
        visibility: 'PUBLIC',
        is18Plus: filterIs18Plus
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des vidéos' });
  }
});

// Upload Vidéo + Notification de publication aux abonnés
app.post('/api/videos/upload', authenticateToken, uploadFields, async (req, res) => {
  try {
    // Restriction de permission : Compte vérifié obligatoire
    const dbUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!dbUser || !dbUser.isVerified) {
      return res.status(403).json({ error: 'Veuillez vérifier votre adresse email pour pouvoir téléverser des vidéos.' });
    }

    const { title, description, category, visibility, is18Plus } = req.body;
    
    if (!req.files || !req.files.video || !req.files.video[0]) {
      return res.status(400).json({ error: 'Aucun fichier vidéo fourni' });
    }

    const videoFile = req.files.video[0];
    const thumbFile = req.files.thumbnail ? req.files.thumbnail[0] : null;
    const nanoId = generateNanoId(9);

    const video = await prisma.video.create({
      data: {
        customId: nanoId,
        title: title || 'Vidéo sans titre',
        description: description || '',
        filename: videoFile.filename,
        thumbnail: thumbFile ? thumbFile.filename : null,
        category: category || 'Divertissement',
        visibility: visibility || 'PUBLIC',
        is18Plus: is18Plus === 'true' || is18Plus === true,
        userId: req.user.id
      }
    });

    if (video.visibility === 'PUBLIC') {
      const followers = await prisma.follow.findMany({
        where: { followingId: req.user.id }
      });

      for (const f of followers) {
        await createNotification(
          f.followerId,
          `🎬 ${req.user.username} a publié une nouvelle vidéo : "${video.title}"`,
          `/video/${video.customId || video.id}`,
          req.user.id
        );
      }
    }
    
    res.json({ success: true, video });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'upload' });
  }
});

app.get('/api/videos/:id', optionalAuthToken, async (req, res) => {
  try {
    const video = await findVideoByIdOrCustomId(req.params.id);
    if (!video) return res.status(404).json({ error: 'Vidéo introuvable' });

    await prisma.video.update({
      where: { id: video.id },
      data: { views: { increment: 1 } }
    });

    const fullVideo = await prisma.video.findUnique({
      where: { id: video.id },
      include: {
        user: { select: { id: true, username: true, avatar: true, bio: true } },
        likes: true
      }
    });

    if (fullVideo.visibility === 'PRIVATE') {
      if (!req.user || req.user.id !== fullVideo.userId) {
        return res.status(403).json({ error: 'Cette vidéo est privée.' });
      }
    }

    const likesCount = fullVideo.likes.filter(l => l.isLike).length;
    const dislikesCount = fullVideo.likes.filter(l => !l.isLike).length;

    let userLikeStatus = null;
    let isFollowingOwner = false;

    if (req.user) {
      const userLike = fullVideo.likes.find(l => l.userId === req.user.id);
      if (userLike) userLikeStatus = userLike.isLike;

      const followRecord = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: req.user.id,
            followingId: fullVideo.userId
          }
        }
      });
      isFollowingOwner = !!followRecord;
    }

    const isOwner = req.user && req.user.id === fullVideo.userId;
    const subscribersCount = isOwner ? await prisma.follow.count({ where: { followingId: fullVideo.userId } }) : null;

    res.json({
      ...fullVideo,
      likesCount,
      dislikesCount,
      userLikeStatus,
      isFollowingOwner,
      subscribersCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la vidéo' });
  }
});

app.get('/api/users/my-videos', authenticateToken, async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      where: { userId: req.user.id },
      include: { likes: true },
      orderBy: { createdAt: 'desc' }
    });
    const formatted = videos.map(v => ({
      ...v,
      likesCount: v.likes.filter(l => l.isLike).length,
      dislikesCount: v.likes.filter(l => !l.isLike).length
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de vos vidéos' });
  }
});

app.put('/api/videos/:id', authenticateToken, uploadFields, async (req, res) => {
  try {
    const video = await findVideoByIdOrCustomId(req.params.id);
    if (!video) return res.status(404).json({ error: 'Vidéo introuvable' });
    if (video.userId !== req.user.id) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à modifier cette vidéo.' });
    }

    const { title, description, category, visibility, is18Plus } = req.body;

    let newFilename = video.filename;
    let newThumbnail = video.thumbnail;

    if (req.files && req.files.video && req.files.video[0]) {
      const oldVideoPath = path.join(videoUploadDir, video.filename);
      if (fs.existsSync(oldVideoPath)) fs.unlinkSync(oldVideoPath);
      newFilename = req.files.video[0].filename;
    }

    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      if (video.thumbnail) {
        const oldThumbPath = path.join(thumbUploadDir, video.thumbnail);
        if (fs.existsSync(oldThumbPath)) fs.unlinkSync(oldThumbPath);
      }
      newThumbnail = req.files.thumbnail[0].filename;
    }

    const updatedVideo = await prisma.video.update({
      where: { id: video.id },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        category: category || undefined,
        visibility: visibility || undefined,
        is18Plus: is18Plus !== undefined ? (is18Plus === 'true' || is18Plus === true) : undefined,
        filename: newFilename,
        thumbnail: newThumbnail
      }
    });

    res.json({ success: true, video: updatedVideo });
  } catch (error) {
    console.error('Erreur modification vidéo:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la vidéo' });
  }
});

app.delete('/api/videos/:id', authenticateToken, async (req, res) => {
  try {
    const video = await findVideoByIdOrCustomId(req.params.id);
    if (!video) return res.status(404).json({ error: 'Vidéo introuvable' });
    if (video.userId !== req.user.id) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à supprimer cette vidéo.' });
    }

    const videoPath = path.join(videoUploadDir, video.filename);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
    if (video.thumbnail) {
      const thumbPath = path.join(thumbUploadDir, video.thumbnail);
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
    }

    await prisma.video.delete({ where: { id: video.id } });

    res.json({ success: true, message: 'Vidéo supprimée avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la vidéo' });
  }
});

app.post('/api/videos/:id/like', authenticateToken, async (req, res) => {
  try {
    const video = await findVideoByIdOrCustomId(req.params.id);
    if (!video) return res.status(404).json({ error: 'Vidéo introuvable' });
    const videoId = video.id;
    const { isLike } = req.body;

    const existingLike = await prisma.like.findUnique({
      where: {
        videoId_userId: {
          videoId,
          userId: req.user.id
        }
      }
    });

    if (existingLike) {
      if (existingLike.isLike === isLike) {
        await prisma.like.delete({ where: { id: existingLike.id } });
      } else {
        await prisma.like.update({
          where: { id: existingLike.id },
          data: { isLike }
        });
      }
    } else {
      await prisma.like.create({
        data: {
          videoId,
          userId: req.user.id,
          isLike
        }
      });

      if (isLike) {
        await createNotification(
          video.userId,
          `👍 ${req.user.username} a aimé votre vidéo "${video.title}" !`,
          `/video/${video.customId || video.id}`,
          req.user.id
        );
      }
    }

    const likesCount = await prisma.like.count({ where: { videoId, isLike: true } });
    const dislikesCount = await prisma.like.count({ where: { videoId, isLike: false } });

    res.json({ success: true, likesCount, dislikesCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du J\'aime/Je n\'aime pas' });
  }
});

// --- ROUTES COMMENTAIRES ---

app.get('/api/videos/:id/comments', async (req, res) => {
  try {
    const video = await findVideoByIdOrCustomId(req.params.id);
    if (!video) return res.status(404).json({ error: 'Vidéo introuvable' });

    const comments = await prisma.comment.findMany({
      where: { videoId: video.id, parentId: null },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        replies: {
          include: { user: { select: { id: true, username: true, avatar: true } } },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des commentaires' });
  }
});

app.post('/api/videos/:id/comments', authenticateToken, async (req, res) => {
  try {
    // Restriction de permission : Compte vérifié obligatoire
    const dbUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!dbUser || !dbUser.isVerified) {
      return res.status(403).json({ error: 'Veuillez vérifier votre adresse email pour pouvoir publier des commentaires.' });
    }

    const video = await findVideoByIdOrCustomId(req.params.id);
    if (!video) return res.status(404).json({ error: 'Vidéo introuvable' });
    const videoId = video.id;

    const { content, parentId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Le commentaire ne peut pas être vide.' });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        videoId,
        userId: req.user.id,
        parentId: parentId ? parseInt(parentId, 10) : null
      },
      include: { user: { select: { id: true, username: true, avatar: true } } }
    });

    await createNotification(
      video.userId,
      `💬 ${req.user.username} a commenté votre vidéo "${video.title}" !`,
      `/video/${video.customId || video.id}`,
      req.user.id
    );

    res.json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la publication du commentaire' });
  }
});

app.put('/api/comments/:id', authenticateToken, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    const { content } = req.body;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: 'Commentaire introuvable.' });
    if (comment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres commentaires.' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Le contenu du commentaire est requis.' });
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
        isEdited: true
      },
      include: { user: { select: { id: true, username: true, avatar: true } } }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la modification du commentaire' });
  }
});

app.delete('/api/comments/:id', authenticateToken, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) return res.status(404).json({ error: 'Commentaire introuvable' });
    if (comment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres commentaires.' });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    res.json({ success: true, message: 'Commentaire supprimé.' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du commentaire' });
  }
});

app.get('/api/users/my-comments', authenticateToken, async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { userId: req.user.id },
      include: { video: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de vos commentaires' });
  }
});

// --- NOTIFICATIONS ---

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
  }
});

// Marquer une notification spécifique comme lue au clic
app.post('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    await prisma.notification.updateMany({
      where: { id: notifId, userId: req.user.id },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour notification' });
  }
});

app.post('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour des notifications' });
  }
});

// STREAMING VIDÉO
app.get('/api/videos/stream/:filename', (req, res) => {
  const videoPath = path.join(videoUploadDir, req.params.filename);
  
  if (!fs.existsSync(videoPath)) {
    return res.status(404).send('Vidéo introuvable');
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, {start, end});
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

app.listen(PORT, () => {
  console.log(`Serveur Node.js démarré sur http://localhost:${PORT}`);
});
