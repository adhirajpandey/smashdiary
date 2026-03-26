import { saveMatch } from "@/lib/commands/save-match";
import { getMatchByIdQuery, listMatchesQuery } from "@/lib/queries/matches";
import { listPlayersQuery } from "@/lib/queries/players";

export const listPlayers = listPlayersQuery;
export const listGames = listMatchesQuery;
export const getGameById = getMatchByIdQuery;
export const saveGame = saveMatch;
