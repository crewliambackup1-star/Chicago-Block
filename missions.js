export const CAMPAIGN_MISSIONS = Object.freeze([
  Object.freeze({ id: 'welcome', title: 'A Neighborly Welcome' }),
  Object.freeze({ id: 'pitch-in', title: 'Pitching In' }),
  Object.freeze({ id: 'courtyard-day', title: 'Courtyard Day' })
]);

const OBJECTIVES = Object.freeze([
  Object.freeze({
    id: 'meet-maya',
    missionId: 'welcome',
    description: 'Meet Maya at the Courtyard Garden and hear how you can help.',
    targetIds: Object.freeze(['maya'])
  }),
  Object.freeze({
    id: 'collect-supplies',
    missionId: 'pitch-in',
    description: 'Collect the three neighborhood supply crates. Visit the marked locations in any order.',
    targetIds: Object.freeze(['supply-market', 'supply-west', 'supply-garden']),
    requiredCount: 3
  }),
  Object.freeze({
    id: 'report-to-maya',
    missionId: 'pitch-in',
    description: 'Return to Maya at the Courtyard Garden with the supplies.',
    targetIds: Object.freeze(['maya'])
  }),
  Object.freeze({
    id: 'collect-decorations',
    missionId: 'courtyard-day',
    description: 'Pick up the courtyard decorations from the Corner Market.',
    targetIds: Object.freeze(['market-decorations'])
  }),
  Object.freeze({
    id: 'deliver-decorations',
    missionId: 'courtyard-day',
    description: 'Bring the decorations to Maya at the Courtyard Garden.',
    targetIds: Object.freeze(['courtyard-dropoff'])
  })
]);

const copyState = state => ({
  objectiveIndex: state.objectiveIndex,
  collectedSupplies: [...state.collectedSupplies],
  completedMissionIds: [...state.completedMissionIds],
  completed: Boolean(state.completed)
});

export function createCampaignState() {
  return {
    objectiveIndex: 0,
    collectedSupplies: [],
    completedMissionIds: [],
    completed: false
  };
}

export function normalizeCampaignState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return createCampaignState();
  const validSupplyIds = new Set(['supply-market', 'supply-west', 'supply-garden']);
  const validMissionIds = new Set(CAMPAIGN_MISSIONS.map(item => item.id));
  const collectedSupplies = Array.isArray(value.collectedSupplies)
    ? [...new Set(value.collectedSupplies.filter(id => validSupplyIds.has(id)))].slice(0, 3)
    : [];
  const completedMissionIds = Array.isArray(value.completedMissionIds)
    ? [...new Set(value.completedMissionIds.filter(id => validMissionIds.has(id)))].slice(0, 3)
    : [];
  const objectiveIndex = Number.isSafeInteger(value.objectiveIndex)
    ? Math.max(0, Math.min(OBJECTIVES.length, value.objectiveIndex))
    : 0;
  const completed = objectiveIndex === OBJECTIVES.length && Boolean(value.completed);
  return {
    objectiveIndex: completed ? OBJECTIVES.length : Math.min(objectiveIndex, OBJECTIVES.length - 1),
    collectedSupplies,
    completedMissionIds,
    completed
  };
}

export function getCampaignObjective(state) {
  if (!state || state.completed) return null;
  const objective = OBJECTIVES[state.objectiveIndex];
  if (!objective) return null;
  const targetIds = objective.requiredCount
    ? objective.targetIds.filter(id => !state.collectedSupplies.includes(id))
    : [...objective.targetIds];
  return {
    id: objective.id,
    missionId: objective.missionId,
    missionTitle: CAMPAIGN_MISSIONS.find(item => item.id === objective.missionId)?.title ?? 'Neighborhood Mission',
    description: objective.description,
    targetIds,
    requiredCount: objective.requiredCount ?? 0
  };
}

export function getCampaignProgress(state) {
  const objective = getCampaignObjective(state);
  return {
    completed: Boolean(state?.completed),
    completedMissions: state?.completedMissionIds?.length ?? 0,
    totalMissions: CAMPAIGN_MISSIONS.length,
    suppliesFound: state?.collectedSupplies?.length ?? 0,
    suppliesRequired: 3,
    currentMissionId: objective?.missionId ?? null,
    currentMissionTitle: objective?.missionTitle ?? null,
    currentObjectiveId: objective?.id ?? null
  };
}

export function applyCampaignInteraction(state, targetId) {
  const current = copyState(state || createCampaignState());
  const objective = OBJECTIVES[current.objectiveIndex];
  if (!objective || current.completed || !objective.targetIds.includes(targetId)) {
    return {
      state: current,
      accepted: false,
      stageCompleted: false,
      missionCompleted: false,
      campaignCompleted: current.completed,
      message: 'This is not part of the current mission.'
    };
  }

  if (objective.requiredCount) {
    if (current.collectedSupplies.includes(targetId)) {
      return {
        state: current,
        accepted: false,
        stageCompleted: false,
        missionCompleted: false,
        campaignCompleted: false,
        message: 'You already collected this supply crate.'
      };
    }
    current.collectedSupplies.push(targetId);
    const stageCompleted = current.collectedSupplies.length >= objective.requiredCount;
    if (!stageCompleted) {
      return {
        state: current,
        accepted: true,
        stageCompleted: false,
        missionCompleted: false,
        campaignCompleted: false,
        message: `Supply collected (${current.collectedSupplies.length}/${objective.requiredCount}). Find the remaining crates.`
      };
    }
  }

  const previousMissionId = objective.missionId;
  current.objectiveIndex += 1;
  const nextObjective = OBJECTIVES[current.objectiveIndex];
  const missionCompleted = !nextObjective || nextObjective.missionId !== previousMissionId;
  if (missionCompleted && !current.completedMissionIds.includes(previousMissionId)) {
    current.completedMissionIds.push(previousMissionId);
  }
  if (!nextObjective) current.completed = true;

  return {
    state: current,
    accepted: true,
    stageCompleted: true,
    missionCompleted,
    campaignCompleted: current.completed,
    message: current.completed
      ? 'Courtyard Day complete! The neighborhood gathering is ready.'
      : missionCompleted
        ? `${CAMPAIGN_MISSIONS.find(item => item.id === previousMissionId)?.title ?? 'Mission'} complete!`
        : 'Objective complete!'
  };
}
