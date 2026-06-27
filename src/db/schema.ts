import { relations, sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const UsersTable = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  susId: integer('sus_id').unique().notNull(),
  email: text('email'),
  displayName: text('display_name').notNull(),
  username: text('username').notNull(),
  avatar: text('avatar'),
  admin: integer('admin', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
  updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`),
});

export const ProjectsTable = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerId: integer('owner_id').notNull().references(() => UsersTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
  updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`),
}, (t) => ({
  ownerSlugUniq: uniqueIndex('owner_slug_uniq').on(t.ownerId, t.slug),
}));

export const DeploysTable = sqliteTable('deploys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => ProjectsTable.id, { onDelete: 'cascade' }),
  version: integer('version').notNull().default(1),
  isLive: integer('is_live', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
}, (t) => ({
  projectVersionUniq: uniqueIndex('project_version_uniq').on(t.projectId, t.version),
}));

export const DeployPagesTable = sqliteTable('deploy_pages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deployId: integer('deploy_id').notNull().references(() => DeploysTable.id, { onDelete: 'cascade' }),
  route: text('route').notNull().default('/'),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
}, (t) => ({
  deployRouteUniq: uniqueIndex('deploy_route_uniq').on(t.deployId, t.route),
}));

export const UsersRelations = relations(UsersTable, ({ many }) => ({
  projects: many(ProjectsTable),
}));

export const ProjectsRelations = relations(ProjectsTable, ({ one, many }) => ({
  owner: one(UsersTable, { fields: [ProjectsTable.ownerId], references: [UsersTable.id] }),
  deploys: many(DeploysTable),
}));

export const DeploysRelations = relations(DeploysTable, ({ one, many }) => ({
  project: one(ProjectsTable, { fields: [DeploysTable.projectId], references: [ProjectsTable.id] }),
  pages: many(DeployPagesTable),
}));

export const DeployPagesRelations = relations(DeployPagesTable, ({ one }) => ({
  deploy: one(DeploysTable, { fields: [DeployPagesTable.deployId], references: [DeploysTable.id] }),
}));
