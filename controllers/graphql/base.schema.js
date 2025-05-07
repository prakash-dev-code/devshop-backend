// controllers/graphql/base.schema.js
const { gql } = require("apollo-server-express");

const baseTypeDefs = gql`
  scalar Date

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }

  type User {
    id: ID!
    name: String!
    email: String!
    # Add other user fields from your model
    createdAt: Date!
    updatedAt: Date!
  }
`;

module.exports = baseTypeDefs;
