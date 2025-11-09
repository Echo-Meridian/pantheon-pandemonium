import * as admin from 'firebase-admin';
import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';

// Initialize Firebase Admin SDK
let adminApp: admin.app.App;
let firestore: Firestore;
let storage: Storage;
let pubsub: PubSub;

export function initializeGoogleCloud() {
  if (!adminApp) {
    // Initialize with service account if provided, otherwise use default credentials
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      adminApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      });
    } else {
      // Use default credentials (for Google Cloud Run)
      adminApp = admin.initializeApp({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      });
    }

    firestore = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });

    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });

    pubsub = new PubSub({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }

  return { adminApp, firestore, storage, pubsub };
}

// Game-specific database operations
export class GameDatabase {
  private db: Firestore;

  constructor() {
    const { firestore } = initializeGoogleCloud();
    this.db = firestore;
  }

  // Games collection
  async createGame(gameData: any): Promise<string> {
    const gameRef = await this.db.collection('games').add({
      ...gameData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return gameRef.id;
  }

  async getGame(gameId: string): Promise<any> {
    const doc = await this.db.collection('games').doc(gameId).get();
    if (!doc.exists) {
      throw new Error('Game not found');
    }
    return { id: doc.id, ...doc.data() };
  }

  async updateGame(gameId: string, updates: any): Promise<void> {
    await this.db.collection('games').doc(gameId).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  async deleteGame(gameId: string): Promise<void> {
    await this.db.collection('games').doc(gameId).delete();
  }

  async listGames(limit: number = 10, offset: number = 0): Promise<any[]> {
    const snapshot = await this.db
      .collection('games')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Players collection
  async createPlayer(playerData: any): Promise<string> {
    const playerRef = await this.db.collection('players').add({
      ...playerData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      stats: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        favoriteDomin: null,
      },
    });
    return playerRef.id;
  }

  async getPlayer(playerId: string): Promise<any> {
    const doc = await this.db.collection('players').doc(playerId).get();
    if (!doc.exists) {
      throw new Error('Player not found');
    }
    return { id: doc.id, ...doc.data() };
  }

  async updatePlayerStats(playerId: string, stats: any): Promise<void> {
    await this.db.collection('players').doc(playerId).update({
      stats,
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // Game sessions
  async createSession(sessionData: any): Promise<string> {
    const sessionRef = await this.db.collection('sessions').add({
      ...sessionData,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active',
    });
    return sessionRef.id;
  }

  async updateSession(sessionId: string, updates: any): Promise<void> {
    await this.db.collection('sessions').doc(sessionId).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  async endSession(sessionId: string, results: any): Promise<void> {
    await this.db.collection('sessions').doc(sessionId).update({
      status: 'completed',
      results,
      endedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // Leaderboard
  async getLeaderboard(limit: number = 10): Promise<any[]> {
    const snapshot = await this.db
      .collection('players')
      .orderBy('stats.wins', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Analytics events
  async logEvent(eventData: any): Promise<void> {
    await this.db.collection('analytics').add({
      ...eventData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // Save game state (for resuming)
  async saveGameState(gameId: string, state: any): Promise<void> {
    await this.db.collection('gamestates').doc(gameId).set({
      state,
      savedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  async loadGameState(gameId: string): Promise<any> {
    const doc = await this.db.collection('gamestates').doc(gameId).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data()?.state;
  }
}

// Asset storage operations
export class AssetStorage {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    const { storage } = initializeGoogleCloud();
    this.storage = storage;
    this.bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'pantheon-pandemonium-assets';
  }

  async uploadAsset(filePath: string, buffer: Buffer, contentType: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        contentType,
      },
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Return the public URL
    return `https://storage.googleapis.com/${this.bucketName}/${filePath}`;
  }

  async downloadAsset(filePath: string): Promise<Buffer> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);
    const [buffer] = await file.download();
    return buffer;
  }

  async deleteAsset(filePath: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);
    await file.delete();
  }

  async listAssets(prefix: string): Promise<string[]> {
    const bucket = this.storage.bucket(this.bucketName);
    const [files] = await bucket.getFiles({ prefix });
    return files.map(file => file.name);
  }
}

// PubSub for real-time game events
export class GameEventBus {
  private pubsub: PubSub;

  constructor() {
    const { pubsub } = initializeGoogleCloud();
    this.pubsub = pubsub;
  }

  async publishGameEvent(topicName: string, event: any): Promise<void> {
    const topic = this.pubsub.topic(topicName);
    const messageBuffer = Buffer.from(JSON.stringify(event));
    await topic.publish(messageBuffer);
  }

  async createSubscription(topicName: string, subscriptionName: string): Promise<void> {
    const topic = this.pubsub.topic(topicName);
    await topic.createSubscription(subscriptionName);
  }

  subscribeToEvents(subscriptionName: string, handler: (message: any) => void): void {
    const subscription = this.pubsub.subscription(subscriptionName);

    subscription.on('message', (message) => {
      const data = JSON.parse(message.data.toString());
      handler(data);
      message.ack();
    });

    subscription.on('error', (error) => {
      console.error('Subscription error:', error);
    });
  }
}

// Export singleton instances
export const gameDatabase = new GameDatabase();
export const assetStorage = new AssetStorage();
export const gameEventBus = new GameEventBus();