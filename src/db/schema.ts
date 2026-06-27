import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, doublePrecision } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  fullName: text('full_name'),
  username: text('username'),
  email: text('email').notNull(),
  profileImage: text('profile_image'),
  experienceLevel: text('experience_level'),
  preferredCurrency: text('preferred_currency').default('USD'),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const trades = pgTable('trades', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  tradeDate: text('trade_date').notNull(),
  entryTime: text('entry_time'),
  exitTime: text('exit_time'),
  asset: text('asset').notNull(),
  tradeType: text('trade_type').notNull(), // 'LONG' or 'SHORT'
  exchange: text('exchange'),
  entryPrice: doublePrecision('entry_price').notNull(),
  stopLoss: doublePrecision('stop_loss'),
  targetPrice: doublePrecision('target_price'),
  exitPrice: doublePrecision('exit_price'),
  lotSize: doublePrecision('lot_size'),
  contractSize: doublePrecision('contract_size'),
  quantity: doublePrecision('quantity').notNull(),
  leverage: doublePrecision('leverage').default(1),
  positionValue: doublePrecision('position_value'),
  usedMargin: doublePrecision('used_margin'),
  roiPercentage: doublePrecision('roi_percentage'),
  riskAmount: doublePrecision('risk_amount'),
  rewardAmount: doublePrecision('reward_amount'),
  riskRewardRatio: doublePrecision('risk_reward_ratio'),
  profitLoss: doublePrecision('profit_loss'),
  profitLossPercentage: doublePrecision('profit_loss_percentage'),
  tradeDuration: text('trade_duration'),
  setupType: text('setup_type'),
  timeframe: text('timeframe'),
  rating: integer('rating'),
  followedPlan: boolean('followed_plan'),
  takeAgain: boolean('take_again'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tradeTags = pgTable('trade_tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
});

export const tradeTagRelations = pgTable('trade_tag_relations', {
  id: serial('id').primaryKey(),
  tradeId: integer('trade_id').references(() => trades.id).notNull(),
  tagId: integer('tag_id').references(() => tradeTags.id).notNull(),
});

export const journalEntries = pgTable('journal_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  tradeId: integer('trade_id').references(() => trades.id),
  tradeDate: text('trade_date').notNull(),
  asset: text('asset'),
  preTradeAnalysis: text('pre_trade_analysis'),
  duringTradeNotes: text('during_trade_notes'),
  postTradeReview: text('post_trade_review'),
  emotions: text('emotions'),
  mistakes: text('mistakes'),
  lessonLearned: text('lesson_learned'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  goalType: text('goal_type').notNull(),
  targetValue: doublePrecision('target_value').notNull(),
  currentValue: doublePrecision('current_value').default(0).notNull(),
  status: text('status').default('ACTIVE'),
  deadline: timestamp('deadline'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const challenges = pgTable('challenges', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  progress: integer('progress').default(0),
  completed: boolean('completed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  achievedAt: timestamp('achieved_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  theme: text('theme').default('dark'),
  currency: text('currency').default('USD'),
  emailNotifications: boolean('email_notifications').default(true),
  weeklyReports: boolean('weekly_reports').default(true),
  dailyReminders: boolean('daily_reminders').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  trades: many(trades),
  journalEntries: many(journalEntries),
  settings: one(userSettings),
  goals: many(goals),
  challenges: many(challenges),
  achievements: many(achievements),
  notifications: many(notifications),
}));

export const tradesRelations = relations(trades, ({ one, many }) => ({
  author: one(users, {
    fields: [trades.userId],
    references: [users.id],
  }),
  tags: many(tradeTagRelations),
  journalEntry: one(journalEntries, {
    fields: [trades.id],
    references: [journalEntries.tradeId],
  }),
}));

export const tradeTagsRelations = relations(tradeTags, ({ many }) => ({
  trades: many(tradeTagRelations),
}));

export const tradeTagRelationsRelations = relations(tradeTagRelations, ({ one }) => ({
  trade: one(trades, {
    fields: [tradeTagRelations.tradeId],
    references: [trades.id],
  }),
  tag: one(tradeTags, {
    fields: [tradeTagRelations.tagId],
    references: [tradeTags.id],
  }),
}));
