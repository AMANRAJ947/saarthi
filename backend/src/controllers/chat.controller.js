import { asyncHandler } from '../utils/asyncHandler.js';
import { chat } from '../services/chatbot.js';

export const sendMessage = asyncHandler(async (req, res) => {
  const { message, history, language, profile } = req.body;
  // Logged-in users: personalise with the saved profile and preferred language.
  const result = await chat({
    message, history,
    language: req.user && language === 'en' ? req.user.preferredLanguage : language,
    profile: profile || req.user?.profile?.toObject(),
  });
  res.json({ success: true, ...result });
});
