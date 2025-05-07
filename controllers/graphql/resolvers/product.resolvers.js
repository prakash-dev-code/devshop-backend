const Product = require("./../../../models/productModel");
const { ApolloError } = require("apollo-server-express");

const productResolvers = {
  ProductCategory: {
    ELECTRONICS: "electronics",
    CLOTHING: "clothing",
    BOOKS: "books",
    HOME: "home",
    OTHER: "other",
  },

  Query: {
    products: async (_, { category, minPrice, maxPrice, search }) => {
      try {
        const query = {};

        if (category) query.category = category;
        if (minPrice || maxPrice) {
          query.price = {};
          if (minPrice) query.price.$gte = minPrice;
          if (maxPrice) query.price.$lte = maxPrice;
        }
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ];
        }

        return await Product.find(query)
          .populate("seller")
          .sort({ createdAt: -1 });
      } catch (error) {
        throw new ApolloError("Failed to fetch products", "DATABASE_ERROR");
      }
    },

    product: async (_, { id, slug }) => {
      try {
        if (id) {
          return await Product.findById(id).populate("seller");
        }
        if (slug) {
          return await Product.findOne({ slug }).populate("seller");
        }
        throw new ApolloError("Must provide either id or slug", "BAD_REQUEST");
      } catch (error) {
        throw new ApolloError("Product not found", "NOT_FOUND");
      }
    },
  },

  Mutation: {
    createProduct: async (_, { input }, { user }) => {
      if (!user)
        throw new ApolloError("Authentication required", "UNAUTHORIZED");

      try {
        const productData = {
          ...input,
          seller: user.id,
        };

        const product = new Product(productData);
        await product.save();

        return product.populate("seller");
      } catch (error) {
        throw new ApolloError(
          `Failed to create product: ${error.message}`,
          "DATABASE_ERROR"
        );
      }
    },

    updateProduct: async (_, { id, input }, { user }) => {
      if (!user)
        throw new ApolloError("Authentication required", "UNAUTHORIZED");

      try {
        const product = await Product.findOneAndUpdate(
          { _id: id, seller: user.id },
          { ...input, updatedAt: Date.now() },
          { new: true, runValidators: true }
        ).populate("seller");

        if (!product) {
          throw new ApolloError(
            "Product not found or unauthorized",
            "NOT_FOUND"
          );
        }

        return product;
      } catch (error) {
        throw new ApolloError(
          `Failed to update product: ${error.message}`,
          "DATABASE_ERROR"
        );
      }
    },

    deleteProduct: async (_, { id }, { user }) => {
      if (!user)
        throw new ApolloError("Authentication required", "UNAUTHORIZED");

      try {
        const product = await Product.findOneAndDelete({
          _id: id,
          seller: user.id,
        });

        if (!product) {
          throw new ApolloError(
            "Product not found or unauthorized",
            "NOT_FOUND"
          );
        }

        return true;
      } catch (error) {
        throw new ApolloError(
          `Failed to delete product: ${error.message}`,
          "DATABASE_ERROR"
        );
      }
    },
  },

  Product: {
    seller: async (parent) => {
      return await parent.populate("seller").then((p) => p.seller);
    },
    id: (parent) => parent._id.toString(),
    createdAt: (parent) => parent.createdAt.toISOString(),
    updatedAt: (parent) => parent.updatedAt?.toISOString(),
  },
};

module.exports = productResolvers;
