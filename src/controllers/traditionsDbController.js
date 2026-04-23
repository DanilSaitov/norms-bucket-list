// Traditions DB controller

const prisma = require('../config/database');
const { Tags_enum } = require('@prisma/client');

const VALID_TAGS = new Set(Object.values(Tags_enum));
const CATEGORY_TAGS = new Set(['sports', 'academic', 'social']);

function getSubmissionModel() {
  return (
    prisma.tradition_Submissions
    || prisma.traditionSubmissions
    || prisma.tradition_submissions
  );
}

function normalizeTagValue(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function parseTagsInput(input) {
  if (input == null) return { tags: [], invalid: [] };

  const rawValues = Array.isArray(input)
    ? input
    : String(input)
      .split(',')
      .map((value) => value.trim());

  const normalized = rawValues
    .map(normalizeTagValue)
    .filter(Boolean);

  const uniqueTags = [...new Set(normalized)];
  const tags = [];
  const invalid = [];

  uniqueTags.forEach((tag) => {
    if (VALID_TAGS.has(tag)) {
      tags.push(tag);
    } else {
      invalid.push(tag);
    }
  });

  return { tags, invalid };
}

async function traditionsSearch(req, res) {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const normalizedSearch = normalizeTagValue(search);
  const searchAsTag = VALID_TAGS.has(normalizedSearch) ? normalizedSearch : null;

  const { tags: tagFilters, invalid: invalidTagFilters } = parseTagsInput(req.query.tags);

  if (invalidTagFilters.length > 0) {
    return res.status(400).json({
      error: 'Invalid tags in query',
      invalid_tags: invalidTagFilters,
      allowed_tags: [...VALID_TAGS],
    });
  }

  const whereClause = {
    is_active: true,
  };

  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];

    if (searchAsTag) {
      whereClause.OR.push({
        tags: {
          some: {
            tag: searchAsTag,
          },
        },
      });
    }
  }

  if (tagFilters.length > 0) {
    whereClause.tags = {
      some: {
        tag: {
          in: tagFilters,
        },
      },
    };
  }

  try {
    const traditions = await prisma.traditions.findMany({
      where: whereClause,
      include: {
        tags: {
          select: {
            tag: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.json(traditions);

  } catch (error) {
    console.error('Get traditions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createTradition(req, res) {
  try {
    const {
      title,
      description,
      category,
      image,
      intermittent = false,
      is_active = true,
      tags,
    } = req.body;

    if (!title || !description || !image) {
      return res.status(400).json({ error: 'title, description, and image are required' });
    }

    const { tags: parsedTags, invalid: invalidTags } = parseTagsInput(tags);

    if (invalidTags.length > 0) {
      return res.status(400).json({
        error: 'Invalid tags in request body',
        invalid_tags: invalidTags,
        allowed_tags: [...VALID_TAGS],
      });
    }

    const normalizedCategoryInput = normalizeTagValue(category);
    const resolvedCategory = CATEGORY_TAGS.has(normalizedCategoryInput)
      ? normalizedCategoryInput
      : (parsedTags.find((tag) => CATEGORY_TAGS.has(tag)) || 'social');

    const created = await prisma.traditions.create({
      data: {
        title,
        description,
        category: resolvedCategory,
        image,
        intermittent: Boolean(intermittent),
        is_active: Boolean(is_active),
        ...(parsedTags.length > 0
          ? {
              tags: {
                create: parsedTags.map((tag) => ({ tag })),
              },
            }
          : {}),
      },
      include: {
        tags: {
          select: {
            tag: true,
          },
        },
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error('Create tradition error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

function getTraditionTags(req, res) {
  return res.json({
    tags: [...VALID_TAGS],
  });
}

async function updateTradition(req, res) {
  const traditionId = Number(req.params.traditionId);

  if (!Number.isInteger(traditionId) || traditionId <= 0) {
    return res.status(400).json({ error: 'Invalid tradition id' });
  }

  try {
    const {
      title,
      description,
      image,
      tags,
    } = req.body;

    if (!title || !description || !image) {
      return res.status(400).json({ error: 'title, description, and image are required' });
    }

    const { tags: parsedTags, invalid: invalidTags } = parseTagsInput(tags);

    if (invalidTags.length > 0) {
      return res.status(400).json({
        error: 'Invalid tags in request body',
        invalid_tags: invalidTags,
        allowed_tags: [...VALID_TAGS],
      });
    }

    const updated = await prisma.traditions.update({
      where: { tradition_id: traditionId },
      data: {
        title,
        description,
        image,
        tags: {
          deleteMany: {},
          ...(parsedTags.length > 0
            ? {
                create: parsedTags.map((tag) => ({ tag })),
              }
            : {}),
        },
      },
      include: {
        tags: {
          select: {
            tag: true,
          },
        },
      },
    });

    return res.json({ tradition: updated });
  } catch (error) {
    console.error('Update tradition error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Tradition not found' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
}

async function deleteTradition(req, res) {
  const traditionId = Number(req.params.traditionId);

  if (!Number.isInteger(traditionId) || traditionId <= 0) {
    return res.status(400).json({ error: 'Invalid tradition id' });
  }

  try {
    const submissionModel = getSubmissionModel();

    if (submissionModel) {
      await submissionModel.deleteMany({
        where: {
          tradition_id: traditionId,
        },
      });
    }

    await prisma.tag.deleteMany({
      where: {
        tradition_id: traditionId,
      },
    });

    await prisma.traditions.delete({
      where: {
        tradition_id: traditionId,
      },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete tradition error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Tradition not found' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
}

function uploadTraditionImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Image file is required' });
  }

  const imagePath = `/uploads/traditions/${req.file.filename}`;
  return res.status(201).json({ image: imagePath });
}

async function getMyTraditionSubmission(req, res) {
  const traditionId = Number(req.params.traditionId);

  if (!Number.isInteger(traditionId) || traditionId <= 0) {
    return res.status(400).json({ error: 'Invalid tradition id' });
  }

  try {
    const submissionModel = getSubmissionModel();

    if (!submissionModel) {
      throw new Error('Submission model is not available on Prisma client. Run prisma generate and restart the server.');
    }

    const latestSubmission = await submissionModel.findFirst({
      where: {
        user_id: req.userId,
        tradition_id: traditionId,
      },
      orderBy: {
        submitted_at: 'desc',
      },
      select: {
        submission_id: true,
        status: true,
        approved: true,
        submitted_at: true,
        admin_comment: true,
        text_submission: true,
        image_submission: true,
      },
    });

    return res.json({ submission: latestSubmission || null });
  } catch (error) {
    console.error('Get my tradition submission error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function createTraditionSubmission(req, res) {
  const traditionId = Number(req.params.traditionId);
  const textSubmission = typeof req.body.text_submission === 'string'
    ? req.body.text_submission.trim()
    : '';

  if (!Number.isInteger(traditionId) || traditionId <= 0) {
    return res.status(400).json({ error: 'Invalid tradition id' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Image submission is required' });
  }

  if (!textSubmission) {
    return res.status(400).json({ error: 'Text submission is required' });
  }

  try {
    const submissionModel = getSubmissionModel();

    if (!submissionModel) {
      throw new Error('Submission model is not available on Prisma client. Run prisma generate and restart the server.');
    }

    const tradition = await prisma.traditions.findUnique({
      where: { tradition_id: traditionId },
      select: { tradition_id: true, is_active: true },
    });

    if (!tradition || !tradition.is_active) {
      return res.status(404).json({ error: 'Tradition not found' });
    }

    const latestSubmission = await submissionModel.findFirst({
      where: {
        user_id: req.userId,
        tradition_id: traditionId,
      },
      orderBy: {
        submitted_at: 'desc',
      },
      select: {
        status: true,
      },
    });

    if (latestSubmission && latestSubmission.status !== 'denied') {
      return res.status(409).json({
        error: 'You can only submit again after your previous submission is denied.',
      });
    }

    const createdSubmission = await submissionModel.create({
      data: {
        user_id: req.userId,
        tradition_id: traditionId,
        image_submission: `/uploads/submissions/${req.file.filename}`,
        text_submission: textSubmission,
        status: 'pending',
        approved: null,
      },
      select: {
        submission_id: true,
        status: true,
        approved: true,
        submitted_at: true,
        admin_comment: true,
        text_submission: true,
        image_submission: true,
      },
    });

    return res.status(201).json({ submission: createdSubmission });
  } catch (error) {
    console.error('Create tradition submission error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getMyPendingSubmissions(req, res) {
  try {
    const submissionModel = getSubmissionModel();

    if (!submissionModel) {
      throw new Error('Submission model is not available on Prisma client. Run prisma generate and restart the server.');
    }

    const submissions = await submissionModel.findMany({
      where: {
        user_id: req.userId,
        status: 'pending',
      },
      include: {
        tradition: {
          select: {
            tradition_id: true,
            title: true,
            description: true,
            image: true,
            category: true,
            tags: {
              select: { tag: true },
            },
          },
        },
      },
      orderBy: {
        submitted_at: 'desc',
      },
    });

    return res.json({ submissions });
  } catch (error) {
    console.error('Get my pending submissions error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getMyCompletedSubmissions(req, res) {
  try {
    const submissionModel = getSubmissionModel();

    if (!submissionModel) {
      throw new Error('Submission model is not available on Prisma client. Run prisma generate and restart the server.');
    }

    const submissions = await submissionModel.findMany({
      where: {
        user_id: req.userId,
        status: 'approved',
      },
      include: {
        tradition: {
          select: {
            tradition_id: true,
            title: true,
            description: true,
            image: true,
            category: true,
          },
        },
      },
      orderBy: {
        submitted_at: 'desc',
      },
    });

    return res.json({ submissions });
  } catch (error) {
    console.error('Get my completed submissions error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getTraditionsAwaitingReview(req, res) {
  try {
    const traditions = await prisma.traditions.findMany({
      where: {
        submissions: {
          some: {
            status: 'pending',
          },
        },
      },
      select: {
        tradition_id: true,
        title: true,
        description: true,
        image: true,
        category: true,
        created_at: true,
        submissions: {
          where: {
            status: 'pending',
          },
          select: {
            submission_id: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return res.json({
      traditions: traditions.map((tradition) => ({
        ...tradition,
        pending_submission_count: tradition.submissions.length,
      })),
    });
  } catch (error) {
    console.error('Get traditions awaiting review error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getTraditionPendingSubmissions(req, res) {
  const traditionId = Number(req.params.traditionId);

  if (!Number.isInteger(traditionId) || traditionId <= 0) {
    return res.status(400).json({ error: 'Invalid tradition id' });
  }

  try {
    const submissionModel = getSubmissionModel();

    if (!submissionModel) {
      throw new Error('Submission model is not available on Prisma client. Run prisma generate and restart the server.');
    }

    const submissions = await submissionModel.findMany({
      where: {
        tradition_id: traditionId,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            first_name: true,
            last_name: true,
            profile_image_url: true,
            graduation_year: true,
          },
        },
        tradition: {
          select: {
            tradition_id: true,
            title: true,
            description: true,
            image: true,
            category: true,
          },
        },
      },
      orderBy: {
        submitted_at: 'asc',
      },
    });

    return res.json({ submissions });
  } catch (error) {
    console.error('Get tradition pending submissions error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function reviewTraditionSubmission(req, res) {
  try {
    const submissionId = Number(req.params.submissionId);
    const { action, admin_comment } = req.body;

    if (!['approve', 'deny'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approve" or "deny"' });
    }

    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return res.status(400).json({ error: 'Invalid submission id' });
    }

    const submissionModel = getSubmissionModel();

    if (!submissionModel) {
      throw new Error('Submission model is not available on Prisma client. Run prisma generate and restart the server.');
    }

    const submission = await submissionModel.findUnique({
      where: { submission_id: submissionId },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            first_name: true,
            last_name: true,
            graduation_year: true,
            profile_image_url: true,
          },
        },
        tradition: {
          select: {
            tradition_id: true,
            title: true,
          },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ error: 'Submission has already been reviewed' });
    }

    const updatedSubmission = await submissionModel.update({
      where: { submission_id: submissionId },
      data: {
        status: action === 'approve' ? 'approved' : 'denied',
        approved: action === 'approve',
        admin_comment: admin_comment ? String(admin_comment).trim() : null,
      },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            first_name: true,
            last_name: true,
            graduation_year: true,
            profile_image_url: true,
          },
        },
        tradition: {
          select: {
            tradition_id: true,
            title: true,
            description: true,
            image: true,
            category: true,
          },
        },
      },
    });

    try {
      const traditionTitle = submission?.tradition?.title || 'your tradition';
      const notificationType = action === 'approve' ? 'submission_approved' : 'submission_denied';
      const notificationTitle = traditionTitle;
      const notificationMessage = action === 'approve'
        ? `Your submission has been approved.`
        : `Your submission has been denied.${admin_comment ? ` Reason: ${String(admin_comment).trim()}` : ''}`;

      await prisma.notification.create({
        data: {
          user_id: submission.user_id,
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          related_id: submission.tradition_id,
        },
      });
    } catch (notificationError) {
      // Review result should still succeed even if notification delivery fails.
      console.error('Notification create error after submission review:', notificationError);
    }

    return res.json({ submission: updatedSubmission });
  } catch (error) {
    console.error('Review tradition submission error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getMySubmissions(req, res) {
  try {
    const submissionModel = getSubmissionModel();

    if (!submissionModel) {
      throw new Error('Submission model is not available on Prisma client. Run prisma generate and restart the server.');
    }

    const submissions = await submissionModel.findMany({
      where: {
        user_id: req.userId,
        image_submission: {
          not: null,
        },
      },
      select: {
        submission_id: true,
        status: true,
        approved: true,
        submitted_at: true,
        image_submission: true,
        tradition: {
          select: {
            tradition_id: true,
            title: true,
          },
        },
      },
      orderBy: {
        submitted_at: 'desc',
      },
    });

    return res.json({ submissions });
  } catch (error) {
    console.error('Get my submissions error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function submitTraditionSuggestion(req, res) {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'title and description are required' });
    }

    const suggestion = await prisma.tradition_Suggestions.create({
      data: {
        user_id: req.userId,
        title: title.trim(),
        description: description.trim(),
        status: 'pending',
      },
    });

    return res.status(201).json({ suggestion });
  } catch (error) {
    console.error('Submit tradition suggestion error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getTraditionSuggestions(req, res) {
  try {
    const { status } = req.query;
    const whereClause = {};

    if (status && ['pending', 'approved', 'denied'].includes(status)) {
      whereClause.status = status;
    }

    const suggestions = await prisma.tradition_Suggestions.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        submitted_at: 'desc',
      },
    });

    return res.json({ suggestions });
  } catch (error) {
    console.error('Get tradition suggestions error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function reviewTraditionSuggestion(req, res) {
  try {
    const suggestionId = Number(req.params.suggestionId);
    const { action, admin_comment } = req.body;

    if (!['approve', 'deny'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approve" or "deny"' });
    }

    if (!Number.isInteger(suggestionId) || suggestionId <= 0) {
      return res.status(400).json({ error: 'Invalid suggestion id' });
    }

    const suggestion = await prisma.tradition_Suggestions.findUnique({
      where: { suggestion_id: suggestionId },
    });

    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    if (suggestion.status !== 'pending') {
      return res.status(400).json({ error: 'Suggestion has already been reviewed' });
    }

    const updateData = {
      status: action === 'approve' ? 'approved' : 'denied',
      admin_comment: admin_comment || null,
      reviewed_at: new Date(),
      reviewed_by: req.userId,
    };

    const updatedSuggestion = await prisma.tradition_Suggestions.update({
      where: { suggestion_id: suggestionId },
      data: updateData,
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    // Create notification for the user
    const notificationType = action === 'approve' ? 'suggestion_approved' : 'suggestion_denied';
    const notificationTitle = suggestion.title;
    const notificationMessage = action === 'approve'
      ? `Your suggestion has been approved.`
      : `Your suggestion has been denied.${admin_comment ? ` Reason: ${admin_comment}` : ''}`;

    await prisma.notification.create({
      data: {
        user_id: suggestion.user_id,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        related_id: suggestionId,
      },
    });

    return res.json({ suggestion: updatedSuggestion });
  } catch (error) {
    console.error('Review tradition suggestion error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getMySuggestions(req, res) {
  try {
    const suggestions = await prisma.tradition_Suggestions.findMany({
      where: {
        user_id: req.userId,
      },
      select: {
        suggestion_id: true,
        title: true,
        description: true,
        status: true,
        admin_comment: true,
        submitted_at: true,
        reviewed_at: true,
      },
      orderBy: {
        submitted_at: 'desc',
      },
    });

    return res.json({ suggestions });
  } catch (error) {
    console.error('Get my suggestions error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

// Feedback functions
async function submitFeedback(req, res) {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    if (subject.length > 100) {
      return res.status(400).json({ error: 'Subject must be 100 characters or less' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message must be 1000 characters or less' });
    }

    const feedback = await prisma.feedback.create({
      data: {
        user_id: req.userId,
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    return res.status(201).json({ feedback });
  } catch (error) {
    console.error('Submit feedback error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getMyFeedback(req, res) {
  try {
    const feedback = await prisma.feedback.findMany({
      where: {
        user_id: req.userId,
      },
      select: {
        feedback_id: true,
        subject: true,
        message: true,
        status: true,
        admin_response: true,
        submitted_at: true,
        responded_at: true,
      },
      orderBy: {
        submitted_at: 'desc',
      },
    });

    return res.json({ feedback });
  } catch (error) {
    console.error('Get my feedback error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getAllFeedback(req, res) {
  try {
    const feedback = await prisma.feedback.findMany({
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        submitted_at: 'desc',
      },
    });

    return res.json({ feedback });
  } catch (error) {
    console.error('Get all feedback error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function respondToFeedback(req, res) {
  try {
    const feedbackId = Number(req.params.feedbackId);
    const { response } = req.body;

    if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
      return res.status(400).json({ error: 'Invalid feedback id' });
    }

    if (!response || response.trim().length === 0) {
      return res.status(400).json({ error: 'Response is required' });
    }

    if (response.length > 1000) {
      return res.status(400).json({ error: 'Response must be 1000 characters or less' });
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { feedback_id: feedbackId },
      data: {
        admin_response: response.trim(),
        status: 'responded',
        responded_at: new Date(),
      },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        user_id: updatedFeedback.user_id,
        type: 'feedback_responded',
        title: 'Feedback Response',
        message: `An administrator has responded to your feedback: "${updatedFeedback.subject}"`,
        related_id: feedbackId,
      },
    });

    return res.json({ feedback: updatedFeedback });
  } catch (error) {
    console.error('Respond to feedback error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
}

async function updateFeedbackStatus(req, res) {
  try {
    const feedbackId = Number(req.params.feedbackId);
    const { status } = req.body;

    if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
      return res.status(400).json({ error: 'Invalid feedback id' });
    }

    const validStatuses = ['unread', 'read', 'responded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: unread, read, responded' });
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { feedback_id: feedbackId },
      data: { status },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    return res.json({ feedback: updatedFeedback });
  } catch (error) {
    console.error('Update feedback status error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
}

// Notification functions
async function getUserNotifications(req, res) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.userId },
      orderBy: { created_at: 'desc' },
      take: 50, // Limit to last 50 notifications
    });

    return res.json({ notifications });
  } catch (error) {
    console.error('Get user notifications error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function markNotificationAsRead(req, res) {
  try {
    const notificationId = Number(req.params.id);

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }

    const notification = await prisma.notification.findUnique({
      where: { notification_id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { notification_id: notificationId },
      data: { is_read: true },
    });

    return res.json({ notification: updatedNotification });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function createNotification(req, res) {
  try {
    const { user_id, type, title, message, related_id } = req.body;

    if (!user_id || !type || !title || !message) {
      return res.status(400).json({ error: 'user_id, type, title, and message are required' });
    }

    const validTypes = ['submission_approved', 'submission_denied', 'suggestion_approved', 'suggestion_denied', 'feedback_responded', 'system_announcement'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid notification type' });
    }

    const notification = await prisma.notification.create({
      data: {
        user_id,
        type,
        title: title.trim(),
        message: message.trim(),
        related_id: related_id ? Number(related_id) : null,
      },
    });

    return res.status(201).json({ notification });
  } catch (error) {
    console.error('Create notification error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function deleteNotification(req, res) {
  try {
    const notificationId = Number(req.params.id);

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }

    const notification = await prisma.notification.findUnique({
      where: { notification_id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.notification.delete({
      where: { notification_id: notificationId },
    });

    return res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function clearAllNotifications(req, res) {
  try {
    const result = await prisma.notification.deleteMany({
      where: { user_id: req.userId },
    });

    return res.json({ success: true, message: 'All notifications cleared', count: result.count });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  traditionsSearch,
  getTraditionTags,
  createTradition,
  updateTradition,
  deleteTradition,
  uploadTraditionImage,
  getMyTraditionSubmission,
  createTraditionSubmission,
  getMyPendingSubmissions,
  getMyCompletedSubmissions,
  getMySubmissions,
  getTraditionsAwaitingReview,
  getTraditionPendingSubmissions,
  reviewTraditionSubmission,
  submitTraditionSuggestion,
  getTraditionSuggestions,
  reviewTraditionSuggestion,
  getMySuggestions,
  submitFeedback,
  getMyFeedback,
  getAllFeedback,
  respondToFeedback,
  updateFeedbackStatus,
  getUserNotifications,
  markNotificationAsRead,
  createNotification,
  deleteNotification,
  clearAllNotifications,
};
