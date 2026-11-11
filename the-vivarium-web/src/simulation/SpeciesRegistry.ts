// src/simulation/SpeciesRegistry.ts
// ============================================================================
// THE VIVARIUM — Species Registry (Lego Pattern Definition)
// V0.1 Scope: Strictly ONE Species (SPECIES_COMMON_FOREST_ANT)
// ============================================================================

export interface SpeciesStats {
  readonly id: string;
  readonly commonName: string;
  readonly scientificName: string;
  readonly moveSpeedPx: number;
  readonly digDurationSec: number;
  readonly fillDurationSec: number;
  readonly maxEnergy: number;
  readonly energyPerDig: number;
  readonly energyPerMovePerSec: number;
  readonly energyRestockThreshold: number;
  readonly carryCapacityMud: number;
}

/**
 * Technical Specification for Ancient Forest Worker Ant
 * Technical Species ID: SPECIES_COMMON_FOREST_ANT
 * Biological reference: Formica rufa (preliminary design reference)
 */
export const COMMON_FOREST_ANT: SpeciesStats = {
  id: 'SPECIES_COMMON_FOREST_ANT',
  commonName: 'Ancient Forest Worker Ant',
  scientificName: 'Formica rufa',
  moveSpeedPx: 48,
  digDurationSec: 3.5,
  fillDurationSec: 2.0,
  maxEnergy: 100,
  energyPerDig: 15,
  energyPerMovePerSec: 1.5,
  energyRestockThreshold: 25,
  carryCapacityMud: 1,
};

export class SpeciesRegistry {
  private static instance: SpeciesRegistry | null = null;
  private registry: Map<string, SpeciesStats> = new Map();

  private constructor() {
    this.registerSpecies(COMMON_FOREST_ANT);
  }

  public static getInstance(): SpeciesRegistry {
    if (!SpeciesRegistry.instance) {
      SpeciesRegistry.instance = new SpeciesRegistry();
    }
    return SpeciesRegistry.instance;
  }

  public registerSpecies(species: SpeciesStats): void {
    this.registry.set(species.id, Object.freeze({ ...species }));
  }

  public getSpecies(id: string): SpeciesStats {
    const species = this.registry.get(id);
    if (!species) {
      throw new Error(`SpeciesRegistry: Unknown species ID "${id}".`);
    }
    return species;
  }

  public getDefaultSpecies(): SpeciesStats {
    return COMMON_FOREST_ANT;
  }

  public hasSpecies(id: string): boolean {
    return this.registry.has(id);
  }
}
