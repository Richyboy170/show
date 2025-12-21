import { firestore, COLLECTIONS } from './firebase';
import {
    Timestamp,
    FieldValue,
    Query,
    DocumentReference,
    CollectionReference
} from 'firebase-admin/firestore';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Video {
    id: string;
    youtubeId: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    publishedAt?: Date;
    duration?: number;
    channelTitle?: string;
    adminId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Lyric {
    id: string;
    videoId: string;
    thaiText: string;
    translation?: string;
    chords?: string;
    pianoNotes?: string;
    section?: string;
    startTime: number;
    endTime: number;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface LyricWord {
    id: string;
    lyricId: string;
    text: string;
    startTime: number;
    duration: number;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Admin {
    id: string;
    email: string;
    name?: string;
    googleId?: string;
    password: string;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    googleId?: string;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Favorite {
    id: string;
    userId?: string;
    adminId?: string;
    videoId: string;
    createdAt: Date;
}

export interface ChannelMonitor {
    id: string;
    channelId: string;
    channelHandle?: string;
    channelTitle?: string;
    lastChecked?: Date;
    lastVideoId?: string;
    lastVideoPublishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Notification {
    id: string;
    adminId: string;
    type: string;
    title: string;
    message: string;
    youtubeId?: string;
    isRead: boolean;
    isApproved?: boolean;
    metadata?: string;
    createdAt: Date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function toDate(timestamp: Timestamp | Date | undefined): Date | undefined {
    if (!timestamp) return undefined;
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return timestamp;
}

function docToVideo(doc: FirebaseFirestore.DocumentSnapshot): Video | null {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
        id: doc.id,
        youtubeId: data.youtubeId,
        title: data.title,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
        publishedAt: toDate(data.publishedAt),
        duration: data.duration,
        channelTitle: data.channelTitle,
        adminId: data.adminId,
        createdAt: toDate(data.createdAt) || new Date(),
        updatedAt: toDate(data.updatedAt) || new Date(),
    };
}

function docToLyric(doc: FirebaseFirestore.DocumentSnapshot): Lyric | null {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
        id: doc.id,
        videoId: data.videoId,
        thaiText: data.thaiText,
        translation: data.translation,
        chords: data.chords,
        pianoNotes: data.pianoNotes,
        section: data.section,
        startTime: data.startTime,
        endTime: data.endTime,
        order: data.order,
        createdAt: toDate(data.createdAt) || new Date(),
        updatedAt: toDate(data.updatedAt) || new Date(),
    };
}

function docToAdmin(doc: FirebaseFirestore.DocumentSnapshot): Admin | null {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
        id: doc.id,
        email: data.email,
        name: data.name,
        googleId: data.googleId,
        password: data.password,
        image: data.image,
        createdAt: toDate(data.createdAt) || new Date(),
        updatedAt: toDate(data.updatedAt) || new Date(),
    };
}

function docToUser(doc: FirebaseFirestore.DocumentSnapshot): User | null {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
        id: doc.id,
        email: data.email,
        name: data.name,
        googleId: data.googleId,
        image: data.image,
        createdAt: toDate(data.createdAt) || new Date(),
        updatedAt: toDate(data.updatedAt) || new Date(),
    };
}

function docToFavorite(doc: FirebaseFirestore.DocumentSnapshot): Favorite | null {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
        id: doc.id,
        userId: data.userId,
        adminId: data.adminId,
        videoId: data.videoId,
        createdAt: toDate(data.createdAt) || new Date(),
    };
}

function docToNotification(doc: FirebaseFirestore.DocumentSnapshot): Notification | null {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
        id: doc.id,
        adminId: data.adminId,
        type: data.type,
        title: data.title,
        message: data.message,
        youtubeId: data.youtubeId,
        isRead: data.isRead ?? false,
        isApproved: data.isApproved,
        metadata: data.metadata,
        createdAt: toDate(data.createdAt) || new Date(),
    };
}

// ============================================================================
// VIDEO OPERATIONS
// ============================================================================

export async function getVideos(options?: {
    orderBy?: 'publishedAt' | 'createdAt';
    orderDirection?: 'asc' | 'desc';
    limit?: number;
    includeLyrics?: boolean;
}): Promise<(Video & { lyrics?: Lyric[] })[]> {
    const {
        orderBy = 'publishedAt',
        orderDirection = 'desc',
        limit: limitCount,
        includeLyrics = false
    } = options || {};

    let query: Query = firestore
        .collection(COLLECTIONS.VIDEOS)
        .orderBy(orderBy, orderDirection);

    if (limitCount) {
        query = query.limit(limitCount);
    }

    const snapshot = await query.get();
    const videos: (Video & { lyrics?: Lyric[] })[] = [];

    for (const doc of snapshot.docs) {
        const video = docToVideo(doc);
        if (video) {
            if (includeLyrics) {
                const lyricsSnapshot = await doc.ref
                    .collection(COLLECTIONS.LYRICS)
                    .orderBy('order', 'asc')
                    .limit(1)
                    .get();
                (video as any).lyrics = lyricsSnapshot.docs
                    .map(d => docToLyric(d))
                    .filter((l): l is Lyric => l !== null);
            }
            videos.push(video);
        }
    }

    return videos;
}

export async function getVideoById(id: string): Promise<Video | null> {
    const doc = await firestore.collection(COLLECTIONS.VIDEOS).doc(id).get();
    return docToVideo(doc);
}

export async function getVideoByYoutubeId(youtubeId: string): Promise<Video | null> {
    const snapshot = await firestore
        .collection(COLLECTIONS.VIDEOS)
        .where('youtubeId', '==', youtubeId)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    return docToVideo(snapshot.docs[0]);
}

export async function createVideo(data: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>): Promise<Video> {
    const now = Timestamp.now();
    const docRef = await firestore.collection(COLLECTIONS.VIDEOS).add({
        ...data,
        publishedAt: data.publishedAt ? Timestamp.fromDate(data.publishedAt) : null,
        createdAt: now,
        updatedAt: now,
    });

    const doc = await docRef.get();
    return docToVideo(doc)!;
}

export async function updateVideo(id: string, data: Partial<Omit<Video, 'id' | 'createdAt'>>): Promise<Video | null> {
    const docRef = firestore.collection(COLLECTIONS.VIDEOS).doc(id);

    const updateData: any = {
        ...data,
        updatedAt: Timestamp.now(),
    };

    if (data.publishedAt) {
        updateData.publishedAt = Timestamp.fromDate(data.publishedAt);
    }

    await docRef.update(updateData);
    const doc = await docRef.get();
    return docToVideo(doc);
}

export async function deleteVideo(id: string): Promise<void> {
    // Delete all lyrics first (subcollection)
    const lyricsSnapshot = await firestore
        .collection(COLLECTIONS.VIDEOS)
        .doc(id)
        .collection(COLLECTIONS.LYRICS)
        .get();

    const batch = firestore.batch();

    for (const lyricDoc of lyricsSnapshot.docs) {
        // Delete words subcollection
        const wordsSnapshot = await lyricDoc.ref.collection(COLLECTIONS.WORDS).get();
        wordsSnapshot.forEach(wordDoc => batch.delete(wordDoc.ref));
        batch.delete(lyricDoc.ref);
    }

    // Delete favorites for this video
    const favoritesSnapshot = await firestore
        .collection(COLLECTIONS.FAVORITES)
        .where('videoId', '==', id)
        .get();
    favoritesSnapshot.forEach(doc => batch.delete(doc.ref));

    // Delete the video
    batch.delete(firestore.collection(COLLECTIONS.VIDEOS).doc(id));

    await batch.commit();
}

// ============================================================================
// LYRICS OPERATIONS
// ============================================================================

export async function getLyricsByVideoId(videoId: string): Promise<Lyric[]> {
    // First find the video document by youtubeId or id
    let videoDocRef: DocumentReference;

    // Check if it's a youtubeId or document id
    const videoDoc = await firestore.collection(COLLECTIONS.VIDEOS).doc(videoId).get();
    if (videoDoc.exists) {
        videoDocRef = videoDoc.ref;
    } else {
        // Try finding by youtubeId
        const snapshot = await firestore
            .collection(COLLECTIONS.VIDEOS)
            .where('youtubeId', '==', videoId)
            .limit(1)
            .get();
        if (snapshot.empty) return [];
        videoDocRef = snapshot.docs[0].ref;
    }

    const lyricsSnapshot = await videoDocRef
        .collection(COLLECTIONS.LYRICS)
        .orderBy('order', 'asc')
        .get();

    return lyricsSnapshot.docs
        .map(doc => docToLyric(doc))
        .filter((l): l is Lyric => l !== null);
}

export async function createLyric(
    videoDocId: string,
    data: Omit<Lyric, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Lyric> {
    const now = Timestamp.now();
    const docRef = await firestore
        .collection(COLLECTIONS.VIDEOS)
        .doc(videoDocId)
        .collection(COLLECTIONS.LYRICS)
        .add({
            ...data,
            createdAt: now,
            updatedAt: now,
        });

    const doc = await docRef.get();
    return docToLyric(doc)!;
}

export async function updateLyric(
    videoDocId: string,
    lyricId: string,
    data: Partial<Omit<Lyric, 'id' | 'createdAt'>>
): Promise<Lyric | null> {
    const docRef = firestore
        .collection(COLLECTIONS.VIDEOS)
        .doc(videoDocId)
        .collection(COLLECTIONS.LYRICS)
        .doc(lyricId);

    await docRef.update({
        ...data,
        updatedAt: Timestamp.now(),
    });

    const doc = await docRef.get();
    return docToLyric(doc);
}

export async function deleteLyric(videoDocId: string, lyricId: string): Promise<void> {
    const lyricRef = firestore
        .collection(COLLECTIONS.VIDEOS)
        .doc(videoDocId)
        .collection(COLLECTIONS.LYRICS)
        .doc(lyricId);

    // Delete words subcollection first
    const wordsSnapshot = await lyricRef.collection(COLLECTIONS.WORDS).get();
    const batch = firestore.batch();
    wordsSnapshot.forEach(doc => batch.delete(doc.ref));
    batch.delete(lyricRef);
    await batch.commit();
}

export async function deleteAllLyricsForVideo(videoDocId: string): Promise<void> {
    const lyricsSnapshot = await firestore
        .collection(COLLECTIONS.VIDEOS)
        .doc(videoDocId)
        .collection(COLLECTIONS.LYRICS)
        .get();

    const batch = firestore.batch();

    for (const lyricDoc of lyricsSnapshot.docs) {
        const wordsSnapshot = await lyricDoc.ref.collection(COLLECTIONS.WORDS).get();
        wordsSnapshot.forEach(wordDoc => batch.delete(wordDoc.ref));
        batch.delete(lyricDoc.ref);
    }

    await batch.commit();
}

// ============================================================================
// ADMIN OPERATIONS
// ============================================================================

export async function getAdminByEmail(email: string): Promise<Admin | null> {
    const snapshot = await firestore
        .collection(COLLECTIONS.ADMINS)
        .where('email', '==', email)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    return docToAdmin(snapshot.docs[0]);
}

export async function getAdminById(id: string): Promise<Admin | null> {
    const doc = await firestore.collection(COLLECTIONS.ADMINS).doc(id).get();
    return docToAdmin(doc);
}

export async function createAdmin(data: Omit<Admin, 'id' | 'createdAt' | 'updatedAt'>): Promise<Admin> {
    const now = Timestamp.now();
    const docRef = await firestore.collection(COLLECTIONS.ADMINS).add({
        ...data,
        createdAt: now,
        updatedAt: now,
    });

    const doc = await docRef.get();
    return docToAdmin(doc)!;
}

export async function updateAdmin(id: string, data: Partial<Omit<Admin, 'id' | 'createdAt'>>): Promise<Admin | null> {
    const docRef = firestore.collection(COLLECTIONS.ADMINS).doc(id);
    await docRef.update({
        ...data,
        updatedAt: Timestamp.now(),
    });

    const doc = await docRef.get();
    return docToAdmin(doc);
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function getUserByEmail(email: string): Promise<User | null> {
    const snapshot = await firestore
        .collection(COLLECTIONS.USERS)
        .where('email', '==', email)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    return docToUser(snapshot.docs[0]);
}

export async function getUserById(id: string): Promise<User | null> {
    const doc = await firestore.collection(COLLECTIONS.USERS).doc(id).get();
    return docToUser(doc);
}

export async function createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = Timestamp.now();
    const docRef = await firestore.collection(COLLECTIONS.USERS).add({
        ...data,
        createdAt: now,
        updatedAt: now,
    });

    const doc = await docRef.get();
    return docToUser(doc)!;
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const docRef = firestore.collection(COLLECTIONS.USERS).doc(id);
    await docRef.update({
        ...data,
        updatedAt: Timestamp.now(),
    });

    const doc = await docRef.get();
    return docToUser(doc);
}

// ============================================================================
// FAVORITES OPERATIONS
// ============================================================================

export async function getFavorite(userId: string | null, adminId: string | null, videoId: string): Promise<Favorite | null> {
    let query: Query = firestore.collection(COLLECTIONS.FAVORITES).where('videoId', '==', videoId);

    if (userId) {
        query = query.where('userId', '==', userId);
    } else if (adminId) {
        query = query.where('adminId', '==', adminId);
    } else {
        return null;
    }

    const snapshot = await query.limit(1).get();
    if (snapshot.empty) return null;
    return docToFavorite(snapshot.docs[0]);
}

export async function getFavoritesByUser(userId: string): Promise<Favorite[]> {
    const snapshot = await firestore
        .collection(COLLECTIONS.FAVORITES)
        .where('userId', '==', userId)
        .get();

    return snapshot.docs
        .map(doc => docToFavorite(doc))
        .filter((f): f is Favorite => f !== null);
}

export async function getFavoritesByAdmin(adminId: string): Promise<Favorite[]> {
    const snapshot = await firestore
        .collection(COLLECTIONS.FAVORITES)
        .where('adminId', '==', adminId)
        .get();

    return snapshot.docs
        .map(doc => docToFavorite(doc))
        .filter((f): f is Favorite => f !== null);
}

export async function createFavorite(data: Omit<Favorite, 'id' | 'createdAt'>): Promise<Favorite> {
    const docRef = await firestore.collection(COLLECTIONS.FAVORITES).add({
        ...data,
        createdAt: Timestamp.now(),
    });

    const doc = await docRef.get();
    return docToFavorite(doc)!;
}

export async function deleteFavorite(id: string): Promise<void> {
    await firestore.collection(COLLECTIONS.FAVORITES).doc(id).delete();
}

// ============================================================================
// NOTIFICATION OPERATIONS
// ============================================================================

export async function getNotificationsByAdmin(adminId: string, unreadOnly = false): Promise<Notification[]> {
    let query: Query = firestore
        .collection(COLLECTIONS.NOTIFICATIONS)
        .where('adminId', '==', adminId)
        .orderBy('createdAt', 'desc');

    if (unreadOnly) {
        query = query.where('isRead', '==', false);
    }

    const snapshot = await query.get();
    return snapshot.docs
        .map(doc => docToNotification(doc))
        .filter((n): n is Notification => n !== null);
}

export async function getNotificationById(id: string): Promise<Notification | null> {
    const doc = await firestore.collection(COLLECTIONS.NOTIFICATIONS).doc(id).get();
    return docToNotification(doc);
}

export async function createNotification(data: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const docRef = await firestore.collection(COLLECTIONS.NOTIFICATIONS).add({
        ...data,
        createdAt: Timestamp.now(),
    });

    const doc = await docRef.get();
    return docToNotification(doc)!;
}

export async function updateNotification(id: string, data: Partial<Omit<Notification, 'id' | 'createdAt'>>): Promise<Notification | null> {
    const docRef = firestore.collection(COLLECTIONS.NOTIFICATIONS).doc(id);
    await docRef.update(data);

    const doc = await docRef.get();
    return docToNotification(doc);
}

// ============================================================================
// CHANNEL MONITOR OPERATIONS
// ============================================================================

export async function getChannelMonitorByChannelId(channelId: string): Promise<ChannelMonitor | null> {
    const snapshot = await firestore
        .collection(COLLECTIONS.CHANNEL_MONITORS)
        .where('channelId', '==', channelId)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
        id: doc.id,
        channelId: data.channelId,
        channelHandle: data.channelHandle,
        channelTitle: data.channelTitle,
        lastChecked: toDate(data.lastChecked),
        lastVideoId: data.lastVideoId,
        lastVideoPublishedAt: toDate(data.lastVideoPublishedAt),
        createdAt: toDate(data.createdAt) || new Date(),
        updatedAt: toDate(data.updatedAt) || new Date(),
    };
}

export async function createChannelMonitor(data: Omit<ChannelMonitor, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChannelMonitor> {
    const now = Timestamp.now();
    const docRef = await firestore.collection(COLLECTIONS.CHANNEL_MONITORS).add({
        ...data,
        lastChecked: data.lastChecked ? Timestamp.fromDate(data.lastChecked) : null,
        lastVideoPublishedAt: data.lastVideoPublishedAt ? Timestamp.fromDate(data.lastVideoPublishedAt) : null,
        createdAt: now,
        updatedAt: now,
    });

    const doc = await docRef.get();
    const docData = doc.data()!;

    return {
        id: doc.id,
        channelId: docData.channelId,
        channelHandle: docData.channelHandle,
        channelTitle: docData.channelTitle,
        lastChecked: toDate(docData.lastChecked),
        lastVideoId: docData.lastVideoId,
        lastVideoPublishedAt: toDate(docData.lastVideoPublishedAt),
        createdAt: toDate(docData.createdAt) || new Date(),
        updatedAt: toDate(docData.updatedAt) || new Date(),
    };
}

export async function updateChannelMonitor(id: string, data: Partial<Omit<ChannelMonitor, 'id' | 'createdAt'>>): Promise<void> {
    const updateData: any = {
        ...data,
        updatedAt: Timestamp.now(),
    };

    if (data.lastChecked) {
        updateData.lastChecked = Timestamp.fromDate(data.lastChecked);
    }
    if (data.lastVideoPublishedAt) {
        updateData.lastVideoPublishedAt = Timestamp.fromDate(data.lastVideoPublishedAt);
    }

    await firestore.collection(COLLECTIONS.CHANNEL_MONITORS).doc(id).update(updateData);
}
