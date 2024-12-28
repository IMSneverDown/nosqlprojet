const { driver } = require('../connexion');
const { GraphQLScalarType, Kind } = require('graphql');

const bigIntFields = [
    'offered_places',
    'credits',
    'applications',
    'students_first_year_2013',
    'foundation'
  ];

// Define the BigInt custom scalar
const BigIntScalar = new GraphQLScalarType({
  name: 'BigInt',
  description: 'Custom BigInt scalar type',
  serialize(value) {
    return value.toString(); // Convert the BigInt to string to avoid precision loss in JSON
  },
  parseValue(value) {
    return BigInt(value); // Convert the input value from client into a BigInt
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return BigInt(ast.value); // Parse INT literal into BigInt
    }
    return null;
  },
});

const resolvers = {
  BigInt: BigIntScalar,
  Query: {
    degrees: async () => {
      const session = driver.session();
      try {
        const result = await session.run('MATCH (d:Degree) RETURN d');
        return result.records.map((record) => {
          const properties = record.get('d').properties;

          // Ensure credits is properly handled
          bigIntFields.forEach((field) => {
            if (properties[field] !== null && properties[field] !== undefined) {
              // Si la valeur est une chaîne, la convertir en BigInt
              if (typeof properties[field] === 'string') {
                properties[field] = BigInt(properties[field]);
              }
            }
          });
          
          return properties;
        });
      } finally {
        session.close();
      }
    },
    campuses:async ()=>{
        const session = driver.session();
            try {
              const result = await session.run('MATCH (c:Campus) RETURN c');
              return result.records.map((record) => record.get('c').properties);
            } finally {
              session.close();  
        }     
    },
    branches:async ()=>{
      const session = driver.session();
          try {
            const result = await session.run('MATCH (b:Branch) RETURN b');
            return result.records.map((record) => record.get('b').properties);
          } finally {
            session.close();  
      }     
  },
  faculties: async () => {
    const session = driver.session();
    try {
      const result = await session.run('MATCH (f:Faculty) RETURN f');
      return result.records.map((record) => {
        const properties = record.get('f').properties;
        
        if (properties.foundation !== null && properties.foundation !== undefined) {
          if (typeof properties.foundation === 'string') {
            properties.foundation = BigInt(properties.foundation);
          }
        }

        return properties;
      });
    } finally {
      session.close();  
    }     
  },
 
partner_institutions:async ()=>{
  const session = driver.session();
      try {
        const result = await session.run('MATCH (p:Partner_institution) RETURN p');
        return result.records.map((record) => record.get('p').properties);
      } finally {
        session.close();  
  }     
},
schools:async ()=>{
  const session = driver.session();
      try {
        const result = await session.run('MATCH (s:School) RETURN s');
        return result.records.map((record) => record.get('s').properties);
      } finally {
        session.close();  
  }     
},
// nombre de diplome par faculte 
degreesCountByFaculty: async () => {
  const session = driver.session();
  try {
    const result = await session.run(
      'MATCH (f:Faculty)-[:TEACHES]->(d:Degree) ' +
      'RETURN f.name AS faculty, COUNT(d) AS degreeCount ' +
      'ORDER BY degreeCount DESC'
    );
    return result.records.map(record => ({
      faculty: record.get('faculty'),
      degreeCount: record.get('degreeCount').toNumber(),
    }));
  } catch (error) {
    console.error('Erreur dans la requête degreesCountByFaculty :', error);
    throw error;
  } finally {
    session.close();
  }
},

// Les branches d'études et leurs diplômes associés
  branchesWithDegrees: async () => {
  const session = driver.session();
  try {
    const result = await session.run(
      'MATCH (b:Branch)<-[:TYPE]-(d:Degree) ' +
      'RETURN b.name AS branch, COLLECT(d.name) AS degrees'
    );
    return result.records.map(record => ({
      branch: record.get('branch'),
      degrees: record.get('degrees'),
    }));
  } catch (error) {
    console.error('Erreur dans la requête branchesWithDegrees :', error);
    throw error;
  } finally {
    session.close();
  }
},
// la moyenne des candidatures rejetées par campus 
  averageRejectedApplicationsByCampus: async () => {
  const session = driver.session();
  try {
      const result = await session.run(
          'MATCH (d:Degree)<-[:TEACHES]-(s)-[:LOCATED_IN]->(c:Campus) ' +
          'RETURN AVG((d.applications) - (d.students_first_year_2013)) AS Rejected, c.name AS Campus ' +
          'ORDER BY c.name'
      );

      return result.records.map(record => ({
          campus: record.get('Campus'),
          rejected: Number(record.get('Rejected')) // Use Number() for conversion
      }));
  } catch (error) {
      console.error('Erreur dans la requête averageRejectedApplicationsByCampus :', error);
      throw error;
  } finally {
      session.close();
  }
},
// Les diplômes offerts dans un campus spécifique
degreesByCampus: async (_, { campusName }) => {
  const session = driver.session();
  try {
    const result = await session.run(
      'MATCH (c:Campus)<-[:LOCATED_IN]-(s:School)-[:TEACHES]->(d:Degree) ' +
      'WHERE c.name = $campusName ' +
      'RETURN d.name AS degree',
      { campusName }
    );
    return result.records.map(record => record.get('degree'));
  } catch (error) {
    console.error('Erreur dans la requête degreesByCampus :', error);
    throw error;
  } finally {
    session.close();
  }
},
// les ecoles et les diplomes associés
schoolsWithDegrees: async () => {
  const session = driver.session();
  try {
      const result = await session.run(
          'MATCH (s:School)-[:TEACHES]->(d:Degree) ' +
          'RETURN s.name AS school, COLLECT(d.name) AS degrees'
      );
      return result.records.map(record => ({
          school: record.get('school'),
          degrees: record.get('degrees'),
      }));
  } catch (error) {
      console.error('Erreur dans la requête schoolsWithDegrees :', error);
      throw error;
  } finally {
      session.close();
  }
},
// les diplomes avec un noombre de credit supérieur à la moyenne des crédits 
  degreesAboveAverageCredits: async () => {
  const session = driver.session();
  try {
      const result = await session.run(
          'MATCH (d:Degree) ' +
          'WITH d, avg(d.credits) AS average ' +
          'MATCH (a:Degree) ' +
          'WHERE a.credits > average ' +
          'RETURN DISTINCT a.name AS Name, a.credits AS Credits'
      );

      return result.records.map(record => ({
          name: record.get('Name'),
          credits: record.get('Credits').toNumber(), 
      }));
  } catch (error) {
      console.error('Error in degreesAboveAverageCredits query:', error);
      throw error;
  } finally {
      session.close();
  }
  },
// nombre de diplomes par branch 
  degreesCountByBranch: async () => {
  const session = driver.session();
  try {
      const result = await session.run(
          'MATCH (b:Branch)<-[:TYPE]-(d:Degree) ' +
          'RETURN b.name AS branch, COUNT(d) AS degreeCount ' +
          'ORDER BY degreeCount DESC'
      );
      return result.records.map(record => ({
          branch: record.get('branch'),
          degreeCount: record.get('degreeCount').toNumber(),
      }));
  } catch (error) {
      console.error('Erreur dans la requête degreesCountByBranch :', error);
      throw error;
  } finally {
      session.close();
  }
  },
  // recuperer un diplome par son id 
  getDegreeByCode: async (_, { code }) => {
    const session = driver.session();
    try {
        const result = await session.run(
            'MATCH (d:Degree {code: $code}) RETURN d',
            { code }
        );

        if (result.records.length === 0) {
            throw new Error('Aucun diplôme trouvé avec ce code.');
        }

        return result.records[0].get('d').properties;
    } catch (error) {
        console.error('Erreur dans la requête degreeByCode :', error);
        throw error;
    } finally {
        session.close();
    }
},
// recuperer une facilté par son nom 
getFacultyByName: async (_, { name }) => {
  const session = driver.session();
  try {
      const result = await session.run(
          'MATCH (f:Faculty {name: $name}) RETURN f',
          { name }
      );

      if (result.records.length === 0) {
          throw new Error('Aucune faculté trouvée avec ce nom.');
      }

      return result.records[0].get('f').properties;
  } catch (error) {
      console.error('Erreur dans la requête facultyByName :', error);
      throw error;
  } finally {
      session.close();
  }
},
// une branche via son nom
getBranchByName: async (_, { name }) => {
  const session = driver.session();
  try {
      const result = await session.run(
          'MATCH (b:Branch {name: $name}) RETURN b',
          { name }
      );

      if (result.records.length === 0) {
          throw new Error('Aucune branche trouvée avec ce nom.');
      }

      return result.records[0].get('b').properties;
  } catch (error) {
      console.error('Erreur dans la requête branchByName :', error);
      throw error;
  } finally {
      session.close();
  }
},
// une ecole via son nom 
getSchoolByName: async (_, { name }) => {
  const session = driver.session();
  try {
      const result = await session.run(
          'MATCH (s:School {name: $name}) RETURN s',
          { name }
      );

      if (result.records.length === 0) {
          throw new Error('Aucune école trouvée avec ce nom.');
      }

      return result.records[0].get('s').properties;
  } catch (error) {
      console.error('Erreur dans la requête schoolByName :', error);
      throw error;
  } finally {
      session.close();
  }
},
// une institution partenaire via son nom
getPartnerInstitutionByName: async (_, { name }) => {
  const session = driver.session();
  try {
      const result = await session.run(
          'MATCH (p:Partner_institution {name: $name}) RETURN p',
          { name }
      );

      if (result.records.length === 0) {
          throw new Error('Aucune institution partenaire trouvée avec ce nom.');
      }

      return result.records[0].get('p').properties;
  } catch (error) {
      console.error('Erreur dans la requête partnerInstitutionByName :', error);
      throw error;
  } finally {
      session.close();
  }
},



  },
  Mutation: {
    // création d'un diplome 
    createDegree: async (_, { offered_places, mark_cut_off, name, credits, applications, code, students_first_year_2013 }) => {
      const session = driver.session();
  
      try {
          
          const existingDegree = await session.run(
              'MATCH (d:Degree {code: $code}) RETURN d',
              { code }
          );
  
          if (existingDegree.records.length > 0) {
              throw new Error('Un diplôme avec ce code existe déjà.');
          }
          // Créer le nouveau diplôme
          const result = await session.run(
              'CREATE (d:Degree { offered_places: $offered_places, mark_cut_off: $mark_cut_off, name: $name, credits: $credits, applications: $applications, code: $code, students_first_year_2013: $students_first_year_2013 }) RETURN d',
              { offered_places, mark_cut_off, name, credits, applications, code, students_first_year_2013 }
          );
  
          if (result.records.length === 0) {
              throw new Error('Échec de la création du diplôme.');
          }
  
          return result.records[0].get('d').properties;
      } catch (error) {
          console.error('Erreur dans la mutation createDegree:', error);
          throw error;
      } finally {
          session.close();
      }
  },
  // mise à jour d'un diplome
  updateDegree: async (_, { offered_places, mark_cut_off, name, credits, applications, code, students_first_year_2013 }) => {
    const session = driver.session();

    try {
        const result = await session.run(
            'MATCH (d:Degree {code: $code}) ' +
            'SET d.offered_places = $offered_places, ' +
            'd.mark_cut_off = $mark_cut_off, ' +
            'd.name = $name, ' +
            'd.credits = $credits, ' +
            'd.applications = $applications, ' +
            'd.students_first_year_2013 = $students_first_year_2013 ' +
            'RETURN d',
            { 
                code, 
                offered_places, 
                mark_cut_off, 
                name, 
                credits, 
                applications, 
                students_first_year_2013 
            }
        );

        if (result.records.length === 0) {
            throw new Error('Aucun diplôme trouvé avec ce code.');
        }

        return result.records[0].get('d').properties;
    } catch (error) {
        console.error('Erreur dans la mutation updateDegree :', error);
        throw error;
    } finally {
        session.close();
    }
},
// suppression d'un diplome
deleteDegree: async (_, { code }) => {
  const session = driver.session();
  try {     
      const result = await session.run(
          'MATCH (d:Degree {code: $code}) ' +
          'DELETE d ' +
          'RETURN COUNT(d) AS deletedCount',
          { code }
      ); 
      const deletedCount = result.records[0].get('deletedCount').toNumber();
      if (deletedCount === 0) {
          throw new Error('Aucun diplôme trouvé avec ce code.');
      }

      return `Diplôme avec le code ${code} a été supprimé avec succès.`;
  } catch (error) {
      console.error('Erreur dans la mutation deleteDegree :', error);
      throw error;
  } finally {
      session.close();
  }
},
// creation campus 
createCampus: async (_, { name, city }) => {
  const session = driver.session();

  try {
      const result = await session.run(
          'CREATE (c:Campus {name: $name, city: $city}) RETURN c',
          { name, city }
      );

      return result.records[0].get('c').properties;
  } catch (error) {
      console.error('Erreur dans la mutation createCampus :', error);
      throw error;
  } finally {
      session.close();
  }
},
// mise à jour campus 
updateCampus: async (_, { name, city }) => {
  const session = driver.session();

  try {
      const result = await session.run(
          'MATCH (c:Campus {name: $name}) ' +
          'SET c.city = $city ' +
          'RETURN c',
          { name, city }
      );

      if (result.records.length === 0) {
          throw new Error('Aucun campus trouvé avec ce nom.');
      }

      return result.records[0].get('c').properties;
  } catch (error) {
      console.error('Erreur dans la mutation updateCampus :', error);
      throw error;
  } finally {
      session.close();
  }
},
// suppression campus 
deleteCampus: async (_, { name }) => {
  const session = driver.session();

  try {
      const result = await session.run(
          'MATCH (c:Campus {name: $name}) ' +
          'DELETE c ' +
          'RETURN COUNT(c) AS deletedCount',
          { name }
      );

      const deletedCount = result.records[0].get('deletedCount').toNumber();
      if (deletedCount === 0) {
          throw new Error('Aucun campus trouvé avec ce nom.');
      }

      return `Campus avec le nom ${name} a été supprimé avec succès.`;
  } catch (error) {
      console.error('Erreur dans la mutation deleteCampus :', error);
      throw error;
  } finally {
      session.close();
  }
},
// creation branche 
createBranch: async (_, { name }) => {
  const session = driver.session();

  try {
      const result = await session.run(
          'CREATE (b:Branch {name: $name}) RETURN b',
          { name }
      );

      return result.records[0].get('b').properties;
  } catch (error) {
      console.error('Erreur dans la mutation createBranch :', error);
      throw error;
  } finally {
      session.close();
  }
},
// mise à jour branche 
updateBranch: async (_, { name }) => {
  const session = driver.session();

  try {
      const result = await session.run(
          'MATCH (b:Branch {name: $name}) ' +
          'RETURN b',
          { name }
      );

      if (result.records.length === 0) {
          throw new Error('Aucune branche trouvée avec ce nom.');
      }

      return result.records[0].get('b').properties;
  } catch (error) {
      console.error('Erreur dans la mutation updateBranch :', error);
      throw error;
  } finally {
      session.close();
  }
},
// suppression branche 
deleteBranch: async (_, { name }) => {
  const session = driver.session();

  try {
      const result = await session.run(
          'MATCH (b:Branch {name: $name}) ' +
          'DELETE b ' +
          'RETURN COUNT(b) AS deletedCount',
          { name }
      );

      const deletedCount = result.records[0].get('deletedCount').toNumber();
      if (deletedCount === 0) {
          throw new Error('Aucune branche trouvée avec ce nom.');
      }

      return `Branche avec le nom ${name} a été supprimée avec succès.`;
  } catch (error) {
      console.error('Erreur dans la mutation deleteBranch :', error);
      throw error;
  } finally {
      session.close();
  }
},
// creation faculté
createFaculty: async (_, { name, foundation, web }) => {
  const session = driver.session();

  try {
      const result = await session.run(
          'CREATE (f:Faculty {name: $name, foundation: $foundation, web: $web}) RETURN f',
          { name, foundation, web }
      );

      return result.records[0].get('f').properties;
  } catch (error) {
      console.error('Erreur dans la mutation createFaculty :', error);
      throw error;
  } finally {
      session.close();
  }
},
// mise à jour faculté
updateFaculty: async (_, { name, foundation, web }) => {
  const session = driver.session();

  try {
      const result = await session.run(
          'MATCH (f:Faculty {name: $name}) ' +
          'SET f.foundation = $foundation, f.web = $web ' +
          'RETURN f',
          { name, foundation, web }
      );

      if (result.records.length === 0) {
          throw new Error('Aucune faculté trouvée avec ce nom.');
      }

      return result.records[0].get('f').properties;
  } catch (error) {
      console.error('Erreur dans la mutation updateFaculty :', error);
      throw error;
  } finally {
      session.close();
  }
},
// suppression faculté
deleteFaculty: async (_, { name }) => {
  const session = driver.session();

  try {
      const result = await session.run(
          'MATCH (f:Faculty {name: $name}) ' +
          'DELETE f ' +
          'RETURN COUNT(f) AS deletedCount',
          { name }
      );

      const deletedCount = result.records[0].get('deletedCount').toNumber();
      if (deletedCount === 0) {
          throw new Error('Aucune faculté trouvée avec ce nom.');
      }

      return `Faculté avec le nom ${name} a été supprimée avec succès.`;
  } catch (error) {
      console.error('Erreur dans la mutation deleteFaculty :', error);
      throw error;
  } finally {
      session.close();
  }
},
// creation instition partenaire
createPartner_institution: async (_, { name, web }) => {
  const session = driver.session();

  try {
      const result = await session.run(
          'CREATE (p:Partner_institution {name: $name, web: $web}) RETURN p',
          { name, web }
      );

      return result.records[0].get('p').properties;
  } catch (error) {
      console.error('Erreur dans la mutation createPartner_institution :', error);
      throw error;
  } finally {
      session.close();
  }
},
// mise à jour instition partainere 
updatePartnerInstitution: async (_, { name, web }) => {
  const session = driver.session();

  try {
      const result = await session.run(
          'MATCH (p:Partner_institution {name: $name}) ' +
          'SET p.web = $web ' +
          'RETURN p',
          { name, web }
      );

      if (result.records.length === 0) {
          throw new Error('Aucune institution partenaire trouvée avec ce nom.');
      }

      return result.records[0].get('p').properties;
  } catch (error) {
      console.error('Erreur dans la mutation updatePartnerInstitution :', error);
      throw error;
  } finally {
      session.close();
  }
},
// suppression institution partenaire
deletePartnerInstitution: async (_, { name }) => {
  const session = driver.session();

  try {
      const result = await session.run(
          'MATCH (p:Partner_institution {name: $name}) ' +
          'DELETE p ' +
          'RETURN COUNT(p) AS deletedCount',
          { name }
      );

      const deletedCount = result.records[0].get('deletedCount').toNumber();
      if (deletedCount === 0) {
          throw new Error('Aucune institution partenaire trouvée avec ce nom.');
      }

      return `Institution partenaire avec le nom ${name} a été supprimée avec succès.`;
  } catch (error) {
      console.error('Erreur dans la mutation deletePartnerInstitution :', error);
      throw error;
  } finally {
      session.close();
  }
},
// creation ecole 
createSchool: async (_, { name, foundation, web }) => {
  const session = driver.session();

  try {
      const result = await session.run(
          'CREATE (s:School {name: $name, foundation: $foundation, web: $web}) RETURN s',
          { name, foundation, web }
      );

      return result.records[0].get('s').properties;
  } catch (error) {
      console.error('Erreur dans la mutation createSchool :', error);
      throw error;
  } finally {
      session.close();
  }
},
// mise à jour ecole 
updateSchool: async (_, { name, foundation, web }) => {
  const session = driver.session();

  try {
      const result = await session.run(
          'MATCH (s:School {name: $name}) ' +
          'SET s.foundation = $foundation, s.web = $web ' +
          'RETURN s',
          { name, foundation, web }
      );

      if (result.records.length === 0) {
          throw new Error('Aucune école trouvée avec ce nom.');
      }

      return result.records[0].get('s').properties;
  } catch (error) {
      console.error('Erreur dans la mutation updateSchool :', error);
      throw error;
  } finally {
      session.close();
  }
},
// suppression ecole 
deleteSchool: async (_, { name }) => {
  const session = driver.session();

  try {
      const result = await session.run(
          'MATCH (s:School {name: $name}) ' +
          'DELETE s ' +
          'RETURN COUNT(s) AS deletedCount',
          { name }
      );

      const deletedCount = result.records[0].get('deletedCount').toNumber();
      if (deletedCount === 0) {
          throw new Error('Aucune école trouvée avec ce nom.');
      }

      return `École avec le nom ${name} a été supprimée avec succès.`;
  } catch (error) {
      console.error('Erreur dans la mutation deleteSchool :', error);
      throw error;
  } finally {
      session.close();
  }
},
teachDegreeToSchool: async (_, { schoolName, degreeName }) => {
  const session = driver.session();
  try {
      const result = await session.run(
          'MATCH (s:School {name: $schoolName}), (d:Degree {name: $degreeName}) ' +
          'CREATE (s)-[:TEACHES]->(d) ' +
          'RETURN s.name AS school, d.name AS degree',
          { schoolName, degreeName }
      );

      return `La school ${result.records[0].get('school')} enseigne le diplôme ${result.records[0].get('degree')}.`;
  } catch (error) {
      console.error('Erreur dans teachDegreeToSchool :', error);
      throw error;
  } finally {
      session.close();
  }
},

teachDegreeToFaculty: async (_, { facultyName, degreeName }) => {
  const session = driver.session();
  try {
      const result = await session.run(
          'MATCH (f:Faculty {name: $facultyName}), (d:Degree {name: $degreeName}) ' +
          'CREATE (f)-[:TEACHES]->(d) ' +
          'RETURN f.name AS faculty, d.name AS degree',
          { facultyName, degreeName }
      );

      return `La faculté ${result.records[0].get('faculty')} enseigne le diplôme ${result.records[0].get('degree')}.`;
  } catch (error) {
      console.error('Erreur dans teachDegreeToFaculty :', error);
      throw error;
  } finally {
      session.close();
  }
},

teachDegreeToPartnerInstitution: async (_, { partnerName, degreeName }) => {
  const session = driver.session();
  try {
      const result = await session.run(
          'MATCH (p:Partner_institution {name: $partnerName}), (d:Degree {name: $degreeName}) ' +
          'CREATE (p)-[:TEACHES]->(d) ' +
          'RETURN p.name AS partner, d.name AS degree',
          { partnerName, degreeName }
      );

      return `L'institution partenaire ${result.records[0].get('partner')} enseigne le diplôme ${result.records[0].get('degree')}.`;
  } catch (error) {
      console.error('Erreur dans teachDegreeToPartnerInstitution :', error);
      throw error;
  } finally {
      session.close();
  }
},

locateSchoolInCampus: async (_, { schoolName, campusName }) => {
  const session = driver.session();
  try {
      const result = await session.run(
          'MATCH (s:School {name: $schoolName}), (c:Campus {name: $campusName}) ' +
          'CREATE (s)-[:LOCATED_IN]->(c) ' +
          'RETURN s.name AS school, c.name AS campus',
          { schoolName, campusName }
      );

      return `L'école ${result.records[0].get('school')} est située dans le campus ${result.records[0].get('campus')}.`;
  } catch (error) {
      console.error('Erreur dans locateSchoolInCampus :', error);
      throw error;
  } finally {
      session.close();
  }
},
locateFacultyInCampus: async (_, { facultyName, campusName }) => {
  const session = driver.session();
  try {
      const result = await session.run(
          'MATCH (f:Faculty {name: $facultyName}), (c:Campus {name: $campusName}) ' +
          'CREATE (f)-[:LOCATED_IN]->(c) ' +
          'RETURN f.name AS faculty, c.name AS campus',
          { facultyName, campusName }
      );

      return `La faculté ${result.records[0].get('faculty')} est située dans le campus ${result.records[0].get('campus')}.`;
  } catch (error) {
      console.error('Erreur dans locateFacultyInCampus :', error);
      throw error;
  } finally {
      session.close();
  }
},
locatePartnerInstitutionInCampus: async (_, { partnerName, campusName }) => {
  const session = driver.session();
  try {
      const result = await session.run(
          'MATCH (p:Partner_institution {name: $partnerName}), (c:Campus {name: $campusName}) ' +
          'CREATE (p)-[:LOCATED_IN]->(c) ' +
          'RETURN p.name AS partner, c.name AS campus',
          { partnerName, campusName }
      );

      return `L'institution partenaire ${result.records[0].get('partner')} est située dans le campus ${result.records[0].get('campus')}.`;
  } catch (error) {
      console.error('Erreur dans locatePartnerInstitutionInCampus :', error);
      throw error;
  } finally {
      session.close();
  }
},
typeDegreeWithBranch: async (_, { degreeName, branchName }) => {
  const session = driver.session();
  try {
      const result = await session.run(
          'MATCH (d:Degree {name: $degreeName}), (b:Branch {name: $branchName}) ' +
          'CREATE (d)-[:TYPE]->(b) ' +
          'RETURN d.name AS degree, b.name AS branch',
          { degreeName, branchName }
      );

      return `Le diplôme ${result.records[0].get('degree')} est de type ${result.records[0].get('branch')}.`;
  } catch (error) {
      console.error('Erreur dans typeDegreeWithBranch :', error);
      throw error;
  } finally {
      session.close();
  }
},


  },
};

module.exports = resolvers;
