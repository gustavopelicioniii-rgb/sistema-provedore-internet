/**
 * Equipment Manager - Unificado para todos os tipos de equipamentos
 * 
 * Este é um stub - a implementação real será feita quando
 * os drivers específicos precisarem ser utilizados
 */

// Placeholder para equipment manager
// A implementação completa está em src/integrations/equipment/

export const equipmentManager = {
  connect: async (equipment: any) => {
    console.log('Equipment connect:', equipment.name)
    return true
  },
  disconnect: async (equipmentId: string) => {
    console.log('Equipment disconnect:', equipmentId)
  },
  getStatus: async (equipmentId: string) => {
    return 'online'
  }
}
