// controllers/graphql/product.schema.js
const { gql } = require('apollo-server-express');

const productTypeDefs = gql`
  enum ProductCategory {
    ELECTRONICS
    CLOTHING
    BOOKS
    HOME
    OTHER
  }

  type ProductImage {
    url: String!
    altText: String
  }

  type ProductVariant {
    size: String
    color: String
    sku: String!
    price: Float!
    stock: Int!
  }

  type ProductRatings {
    average: Float!
    count: Int!
  }

  type Product {
    id: ID!
    name: String!
    description: String!
    price: Float!
    category: ProductCategory!
    images: [ProductImage!]!
    stock: Int!
    ratings: ProductRatings!
    variants: [ProductVariant!]
    seller: User!
    createdAt: String!
    updatedAt: String
    slug: String!
  }

  input ProductImageInput {
    url: String!
    altText: String
  }

  input ProductVariantInput {
    size: String
    color: String
    sku: String!
    price: Float!
    stock: Int!
  }

  input CreateProductInput {
    name: String!
    description: String!
    price: Float!
    category: ProductCategory!
    images: [ProductImageInput!]!
    stock: Int!
    variants: [ProductVariantInput!]
  }

  input UpdateProductInput {
    name: String
    description: String
    price: Float
    category: ProductCategory
    images: [ProductImageInput!]
    stock: Int
    variants: [ProductVariantInput!]
  }

  extend type Query {
    products(
      category: ProductCategory
      minPrice: Float
      maxPrice: Float
      search: String
    ): [Product!]!
    product(id: ID, slug: String): Product
  }

  extend type Mutation {
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
  }
`;

module.exports = productTypeDefs;