export type PersonType = 'Juliana' | 'Gabriel' | 'Ambos'

/**
 * Global person filter — pure UI state, shared by every screen through the
 * Sidemenu. Identification and filtering happen elsewhere (the server enriches
 * `person`, the screens filter on it).
 *
 * useState, not a module-scope ref: a ref hoisted to module scope is shared
 * across requests during SSR and never serialized into the payload.
 */
export const usePersonFilter = () => {
  const selectedPerson = useState<PersonType>('person-filter', () => 'Gabriel')

  const setPersonFilter = (person: PersonType) => {
    selectedPerson.value = person
  }

  return {
    selectedPerson: computed(() => selectedPerson.value),
    setPersonFilter,
  }
}
