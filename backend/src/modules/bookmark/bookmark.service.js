
import Bookmark from "./bookmark.model.js";
import Post from "../post/post.model.js";

export const createBookmark = async ({
  postId,
  userId,
}) => {
  const post = await Post.findOne({
    _id: postId,
    status: "PUBLISHED",
  });

  if (!post) {
    throw new Error("Published post not found");
  }

  const existingBookmark = await Bookmark.findOne({
    post: postId,
    user: userId,
  });

  if (existingBookmark) {
    throw new Error("You have already bookmarked this post");
  }

  try {
    return await Bookmark.create({
      post: postId,
      user: userId,
    });
  } catch (error) {
    // Handles simultaneous duplicate requests.
    if (error.code === 11000) {
      throw new Error("You have already bookmarked this post");
    }

    throw error;
  }
};

export const removeBookmark = async ({
  postId,
  userId,
}) => {
  const bookmark = await Bookmark.findOneAndDelete({
    post: postId,
    user: userId,
  });

  if (!bookmark) {
    throw new Error("Bookmark not found");
  }

  return bookmark;
};

export const getMyBookmarks = async (userId) => {
  const bookmarks = await Bookmark.find({
    user: userId,
  })
    .sort({ createdAt: -1 })
    .populate({
      path: "post",
      match: { status: "PUBLISHED" },
      select: "title slug excerpt coverImage publishedAt author",
      populate: {
        path: "author",
        select: "name",
      },
    });

  // Exclude bookmarks whose posts are no longer published.
  return bookmarks.filter((bookmark) => bookmark.post);
};
