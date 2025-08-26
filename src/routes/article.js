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

      reply.code(500).send({
        success: false,
        error: "Failed to get article",
        message: error.message,
      })
    }
  });

  // Post /article - Create new article
  fastify.post("/article", async (request, reply) => {
    try {
      const {title, content, author, tags} = request.body
      // create new Article instance
    const article = new Article ({
      title,
      content,
      author,
      tags: tags  || [] // default to empty array if no tag is provided
    })
    // save to database
    const savedArticle = await article.save()

    reply.code(201).send({
      success: true,
      message: "Article created successfully",
      data: savedArticle
    });

    } catch (error) {
      // Handle validation error "Mongoose validation error: occurs when data doesn't schema requirements"
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map(err => err.message); // collects all 
        reply.code(400).send({
          success: false,
          error:  "Validation failed",
          details: errors
        })
      }

      reply.code(500).send({
        success: false,
        error: "Failed to create article",
        message: error.message,
      })
    }
  })


  // Put /articles/:id  - Update an existing article
  fastify.put("/articles/:id", async(request, reply) => {
    try {

      const {id} = request.params
      const {title, content, author, tags} = request.body

      // find article by Id and update
      const updatedArticle = await Article.findByIdAndUpdate(
        id, 
        {title, content, author, tags, isPublished},
        {
          new: true,  //return updated document
          runValidators: true // Run schema validayions
        }  
      ).select("-__v");

      if (!updatedArticle) {
        return reply.code(404).send({
          success: false,
          error: "Article not found"
        })
      }

      return {
        success: true,
        message: "Artiicle updated successfully",
        data: updatedArticle,
      }

    } catch (error) {
      if (error.name == "CastError") {
        return reply.code(400).send({
          success: false,
          error: "Invalid article ID format",
        });
      }

      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map(err => err.message); // collects all 
        reply.code(400).send({
          success: false,
          error:  "Validation failed",
          details: errors
        })
      }

      reply.code(500).send({
        success: false,
        error: "Failed to update article",
        message: error.message,
        })
    }
  })


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
