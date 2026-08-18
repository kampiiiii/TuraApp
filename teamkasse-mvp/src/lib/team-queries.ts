import { cache } from "react";
import { getCurrentSession, isAuthConfigured } from "@/lib/auth";
import {
  attachLedgerNames,
  calculateBalances,
  loadTeamState,
  publicMembers
} from "@/lib/team-store";
import type { AppData, AuthState } from "@/lib/types";

const loadRequestState = cache(loadTeamState);

export const getAppData = cache(async function getAppData(): Promise<AppData> {
  const state = await loadRequestState();

  if (!isAuthConfigured()) {
    return emptyData("setup-required", state.team);
  }

  const session = await getCurrentSession(state);

  if (!session) {
    return emptyData("anonymous", state.team);
  }

  const currentMember = state.members.find((member) => member.id === session.memberId) ?? null;

  if (!currentMember) {
    return emptyData("no-team", state.team);
  }

  const isAdmin = currentMember.role === "admin";
  const visibleMembers = isAdmin ? state.members : state.members.filter((member) => member.id === currentMember.id);
  const visibleSourceLedger = isAdmin
    ? state.ledger
    : state.ledger.filter((entry) => entry.member_id === currentMember.id);
  const visibleLedger = attachLedgerNames(visibleSourceLedger, state.members, state.catalog);
  const visibleBalances = calculateBalances(state, isAdmin ? undefined : currentMember.id);

  return {
    isDemo: false,
    authState: "member",
    team: state.team,
    currentMember,
    members: publicMembers(visibleMembers),
    catalog: state.catalog,
    ledger: visibleLedger.sort((left, right) => right.created_at.localeCompare(left.created_at)).slice(0, 100),
    balances: visibleBalances
  };
});

export async function getShellData() {
  const data = await getAppData();

  return {
    isDemo: data.authState === "setup-required",
    authState: data.authState,
    team: data.team,
    currentMember: data.currentMember
  };
}

export const getLoginData = cache(async function getLoginData() {
  const state = await loadRequestState();

  return {
    configured: isAuthConfigured(),
    team: state.team,
    members: publicMembers(state.members.filter((member) => member.active && member.role === "player"))
  };
});

function emptyData(authState: AuthState, team: AppData["team"]): AppData {
  return {
    isDemo: authState === "setup-required",
    authState,
    team,
    currentMember: null,
    members: [],
    catalog: [],
    ledger: [],
    balances: []
  };
}
