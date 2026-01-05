import { db } from '../db/index.ts'
import { eq } from 'drizzle-orm'
import { conceptsTable, usersTable } from '../db/schema.ts'
import type { Concept, NewConcept } from '../db/schema.ts'

const conceptsData = {
  async retrieveUserConcepts(userEmail: string): Promise<Array<Concept>> {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, userEmail),
    })

    if (!user) {
      return []
    }

    const savedConcepts = await db.query.conceptsTable.findMany({
      where: eq(conceptsTable.userId, user.id),
    })

    return savedConcepts
  },

  async saveNewConcept(newConcept: NewConcept): Promise<Array<Concept>> {
    const newlySavedConcept = await db
      .insert(conceptsTable)
      .values(newConcept)
      .returning()

    return newlySavedConcept
  },

  async deleteConcept(conceptId: number): Promise<Array<Concept>> {
    const deletedConcept = await db
      .delete(conceptsTable)
      .where(eq(conceptsTable.id, conceptId))
      .returning()
    return deletedConcept
  },
}

export default conceptsData
