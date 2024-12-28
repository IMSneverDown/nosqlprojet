const { gql } = require('apollo-server');

const typeDefs = gql`
  scalar BigInt

  type Degree {
    offered_places: BigInt
    mark_cut_off: Float
    name: String
    credits: BigInt
    applications: BigInt
    code: ID!
    students_first_year_2013: BigInt
  }

  type Campus {
    name: String
    city: String
  }
  
  type Branch{
   name:String
  }

  type Faculty{
   name:String
   foundation:BigInt
   web:String
  }

  type Partner_institution{
   name:String
   web:String
  }

  type School{
   name:String
   foundation:BigInt
   web:String
  }

  type Mutation {
    createDegree(offered_places: BigInt, mark_cut_off: Float, name: String, credits: BigInt, applications: BigInt, code: ID!, students_first_year_2013: BigInt): Degree
    createCampus(name: String, city: String): Campus
    createBranch(name: String): Branch
    createFaculty(name: String, foundation: BigInt, web: String): Faculty 
    createPartner_institution(name: String, web: String): Partner_institution
    createSchool(name: String, foundation: BigInt, web: String): School
    updateDegree(code: ID!, offered_places: BigInt, mark_cut_off: Float, name: String, credits: BigInt, applications: BigInt, students_first_year_2013: BigInt): Degree
    deleteDegree(code: ID!): String
    updateCampus(name: String!, city: String): Campus
    deleteCampus(name: String!): String
    updateBranch(name: String!): Branch
    deleteBranch(name: String!): String
    updateFaculty(name: String!, foundation: BigInt, web: String): Faculty
    deleteFaculty(name: String!): String
    updatePartnerInstitution(name: String!, web: String): Partner_institution
    deletePartnerInstitution(name: String!): String
    updateSchool(name: String!, foundation: BigInt, web: String): School
    deleteSchool(name: String!): String
    teachDegreeToSchool(schoolName: String!, degreeName: String!): String
    teachDegreeToFaculty(facultyName: String!, degreeName: String!): String
    teachDegreeToPartnerInstitution(partnerName: String!, degreeName: String!): String
    locateSchoolInCampus(schoolName: String!, campusName: String!): String
    locateFacultyInCampus(facultyName: String!, campusName: String!): String
    locatePartnerInstitutionInCampus(partnerName: String!, campusName: String!): String
    typeDegreeWithBranch(degreeName: String!, branchName: String!): String

  }

  type Query {

    getDegreeByCode(code: String!): Degree
    getFacultyByName(name: String!): Faculty
    getBranchByName(name: String!): Branch
    getSchoolByName(name: String!): School
    getPartnerInstitutionByName(name: String!): Partner_institution

    degrees: [Degree] # recupère la liste de tous les diplomes 
    campuses: [Campus] # recupère la liste de tous les campus
    branches:[Branch]  # recupère la liste de toutes les branches
    faculties:[Faculty] # recupère la liste de toutes les favultés 
    partner_institutions:[Partner_institution] # recupère la liste de toutes les institutions partenaires 
    schools:[School] # # recupère la liste de toutes les ecoles 

    degreesCountByFaculty: [FacultyDegreeCount] #	Le nombre de diplômes par faculté
    branchesWithDegrees: [BranchDegrees]       #Les branches d'études et leurs diplômes associés
    degreesByCampus(campusName: String!): [String] # Les diplômes offerts dans un campus spécifique
    schoolsWithDegrees: [SchoolDegrees] #Les écoles et des diplômes qu'elles enseignent
    degreesCountByBranch: [BranchDegreeCount] # Le nombre de diplômes par branche
    averageRejectedApplicationsByCampus: [RejectedApplicationsByCampus] #la moyenne des candidatures rejetées par campus 
    degreesAboveAverageCredits: [DegreeAboveAverage]

  }
  type DegreeAboveAverage {
    name: String
    credits: Float
}

type RejectedApplicationsByCampus {
    campus: String
    rejected: Float
}

type FacultyDegreeCount {
    faculty: String
    degreeCount: Int
}

type BranchDegrees {
    branch: String
    degrees: [String]
}

type SchoolDegrees {
    school: String
    degrees: [String]
}

type BranchDegreeCount {
    branch: String
    degreeCount: Int
}
`;

module.exports = typeDefs;