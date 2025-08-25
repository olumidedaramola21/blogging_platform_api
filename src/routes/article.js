const Article = require("../models/Article");

// Define all article related routes
async function articleRoutes(fastify, options) {
  fastify.get("/articles", async (request, reply) => {
    try {
      const { tags, author, limit = 10, page = 1 } = request.query;

      // convert limit and page to integers for math operation
      limit = parseInt(limit);
      page = parseInt(page);

      // Init mongodb filter object based on the query parameters
      const filter = { isPublished: true };
      if (tags) {
        filter.tags = { $in: tags.split(",") }; // support multilpe tags and $in tells mongodb to return artiles with any of the tags
      }
      if (author) {
        filter.author = new RegExp(author, "i"); // case-insensitive search
      }
      // calculate pagination
      const skip = (page - 1) * limit;

      // query database with filter, sort, and pagination
      const articles = await Article.find(filter)
        .sort({ publishedDate: -1 }) // newest first
        .limit(limit)
        .skip(skip) // skip N results for pagination
        .select("-__v"); // Exclude version field from response

      const total = await Article.countDocuments(filter);
      return {
        success: true,
        data: articles,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalArticles: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: "Failed  to retrieve articles",
        details: error.message,
      });
    }
  });

  // GET /articles/:id - Retrieve a single article by ID
  fastify.get("/articles/:id", async (request, reply) => {
    try {
      const { id } = request.params;

      // find article by Id
      const article = await Article.findById(id).select("-__v");
      if (!article) {
        return reply.code(404).send({
          success: false,
          error: "Article not found",
        });
      }
      return {
        success: true,
        data: article,
      };
    } catch (error) {
      // Handle invalid MongoDB ObjectId
      if (error.name == "CastError") {
        return reply.code(400).send({
          success: false,
          error: "Invalid article ID format",
        });
      }
    }
  });

  // Delete /articles/:id - Delete an article
  fastify.delete("/articles/:id", async (request, reply) => {
    try {
      const { id } = request.params;

      // find and delete article
      const deletedArticle = await Article.findByIdAndDelete(id);

      if (!deletedArticle) {
        return reply.code(404).send({
          success: false,
          error: "Article not found",
        });
      }

      return {
        success: true,
        message: "Article deleted successfully",
        data: { deletedId: id },
      };
    } catch (error) {
      // Handle invalid MongoDb ObjectId
      if (error == "CastError") {
        return reply.code(400).send({
          success: false,
          error: "Invalid article Id format",
        });
      }

      reply.code(500).send({
        success: false,
        error: "Failed to delete article",
        details: error.message,
      });
    }
  });
}

module.exports = articleRoutes;
