import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Get organization profile by user ID (IP-based identifier)
export const getOrgProfile = query({
  args: { userId: v.string() },
  returns: v.union(v.null(), v.object({
    _id: v.id("orgProfiles"),
    _creationTime: v.number(),
    userId: v.string(),
    name: v.string(),
    mission: v.string(),
    tone: v.string(),
    region: v.string(),
    customFields: v.optional(v.record(v.string(), v.any())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("orgProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) return null;

    return {
      _id: profile._id,
      _creationTime: profile._creationTime,
      userId: profile.userId,
      name: profile.name,
      mission: profile.mission,
      tone: profile.tone,
      region: profile.region,
      customFields: profile.customFields,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  },
});

// Create a new organization profile
export const createOrgProfile = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    mission: v.string(),
    tone: v.string(),
    region: v.string(),
    customFields: v.optional(v.record(v.string(), v.any())),
  },
  returns: v.id("orgProfiles"),
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existing = await ctx.db
      .query("orgProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      throw new Error("Organization profile already exists for this user");
    }

    const now = Date.now();

    return await ctx.db.insert("orgProfiles", {
      userId: args.userId,
      name: args.name,
      mission: args.mission,
      tone: args.tone,
      region: args.region,
      customFields: args.customFields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an existing organization profile
export const updateOrgProfile = mutation({
  args: {
    profileId: v.id("orgProfiles"),
    name: v.optional(v.string()),
    mission: v.optional(v.string()),
    tone: v.optional(v.string()),
    region: v.optional(v.string()),
    customFields: v.optional(v.record(v.string(), v.any())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Partial<Doc<"orgProfiles">> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.mission !== undefined) updates.mission = args.mission;
    if (args.tone !== undefined) updates.tone = args.tone;
    if (args.region !== undefined) updates.region = args.region;
    if (args.customFields !== undefined) updates.customFields = args.customFields;

    await ctx.db.patch(args.profileId, updates);
  },
});

// Create or update organization profile (upsert)
export const upsertOrgProfile = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    mission: v.string(),
    tone: v.string(),
    region: v.string(),
    customFields: v.optional(v.record(v.string(), v.any())),
  },
  returns: v.id("orgProfiles"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("orgProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing profile
      await ctx.db.patch(existing._id, {
        name: args.name,
        mission: args.mission,
        tone: args.tone,
        region: args.region,
        customFields: args.customFields,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new profile
      return await ctx.db.insert("orgProfiles", {
        userId: args.userId,
        name: args.name,
        mission: args.mission,
        tone: args.tone,
        region: args.region,
        customFields: args.customFields,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Delete organization profile
export const deleteOrgProfile = mutation({
  args: { profileId: v.id("orgProfiles") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.profileId);
  },
});

// Get organization profile by ID
export const getById = query({
  args: { id: v.id("orgProfiles") },
  returns: v.union(v.null(), v.object({
    _id: v.id("orgProfiles"),
    _creationTime: v.number(),
    userId: v.string(),
    name: v.string(),
    mission: v.string(),
    tone: v.string(),
    region: v.string(),
    customFields: v.optional(v.record(v.string(), v.any())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.id);
    if (!profile) return null;

    return {
      _id: profile._id,
      _creationTime: profile._creationTime,
      userId: profile.userId,
      name: profile.name,
      mission: profile.mission,
      tone: profile.tone,
      region: profile.region,
      customFields: profile.customFields,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  },
});

// Get organization profiles count (for admin/debugging)
export const getProfilesCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const profiles = await ctx.db.query("orgProfiles").collect();
    return profiles.length;
  },
});