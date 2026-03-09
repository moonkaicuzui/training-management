import * as tqcService from '../tqcService';

import type {
  NewTQCTeam,
  NewTQCTeamInput,
  NewTQCTeamUpdate,
} from '@/types';

export async function getNewTQCTeams(includeInactive = false): Promise<NewTQCTeam[]> {
  return tqcService.getTeams(includeInactive);
}

export async function getNewTQCTeamById(teamId: string): Promise<NewTQCTeam | null> {
  return tqcService.getTeamById(teamId);
}

export async function createNewTQCTeam(input: NewTQCTeamInput): Promise<NewTQCTeam> {
  return tqcService.createTeam(input);
}

export async function updateNewTQCTeam(input: NewTQCTeamUpdate): Promise<NewTQCTeam | null> {
  return tqcService.updateTeam(input);
}

export async function deleteNewTQCTeam(teamId: string): Promise<boolean> {
  return tqcService.deleteTeam(teamId);
}
