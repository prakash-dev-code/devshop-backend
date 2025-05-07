// controllers/graphql/user.schema.js
const { gql } = require('apollo-server-express');

const userTypeDefs = gql`
  extend type Query {
    me: User
    users: [User!]!
    user(id: ID!): User
  }

  extend type Mutation {
    login(email: String!, password: String!): AuthPayload!
    register(name: String!, email: String!, password: String!): AuthPayload!
  }

  type AuthPayload {
    token: String!
    user: User!
  }
`;

module.exports = userTypeDefs;