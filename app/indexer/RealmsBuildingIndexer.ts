import { Event } from "../entities/starknet/Event";
import { Context } from "../context";
import BaseContractIndexer from "./BaseContractIndexer";

const CONTRACT =
  "0x04d2078fade1855b48ad11d711d11afa107f050637572eecbab244a4cd7f35cc";

export default class RealmsBuildingIndexer extends BaseContractIndexer {
  constructor(context: Context) {
    super(context, CONTRACT);

    this.addHandler("BuildingBuilt", this.buildBuilding.bind(this));
  }

  async buildBuilding(event: Event): Promise<void> {
    const eventId = event.eventId;
    const params = event.parameters ?? [];
    const realmId = parseInt(params[0]);
    const buildingId = parseInt(params[2]);
    await this.context.prisma.building.upsert({
      where: {
        realmId_eventId: { realmId, eventId }
      },
      create: { realmId, eventId, buildingId },
      update: { buildingId }
    });
  }
}
