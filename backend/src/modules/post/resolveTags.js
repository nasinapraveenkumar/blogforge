
import Tag from "../tag/tag.model.js";

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const resolveTagIds = async (tagNames = []) => {
  const names = [
    ...new Set(
      tagNames
        .map((name) => name.trim())
        .filter(Boolean)
    ),
  ];

  const tags = await Promise.all(
    names.map(async (name) => {
      const slug = slugify(name);

      if (!slug) {
        throw new Error(`Invalid tag name: ${name}`);
      }

      try {
        const tag = await Tag.findOneAndUpdate(
          { slug },
          {
            $setOnInsert: {
              name,
              slug,
            },
          },
          {
            upsert: true,
            returnDocument: "after",
            runValidators: true,
            setDefaultsOnInsert: true,
          }
        );

        return tag._id;
      } catch (error) {
        // Handle two requests creating the same tag simultaneously.
        if (error.code === 11000) {
          const existingTag = await Tag.findOne({ slug });

          if (existingTag) {
            return existingTag._id;
          }
        }

        throw error;
      }
    })
  );

  return tags;
};
