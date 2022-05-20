import { Event } from "../entities/starknet/Event";
import { Context } from "../context";
import { Indexer } from "./../types";
import { BigNumber } from "ethers";
import { hash } from "starknet";

const BUILDINGS_BUILT_SELECTOR = BigNumber.from(
  hash.getSelectorFromName("BuildingBuilt")
).toHexString();

export default class RealmsBuildingIndexer implements Indexer<Event> {
  private CONTRACTS = [
    "0x04d2078fade1855b48ad11d711d11afa107f050637572eecbab244a4cd7f35cc"
  ];
  private context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  contracts(): string[] {
    return this.CONTRACTS;
  }

  isBuildingBuiltEvent(keys: string[]) {
    if (keys?.length !== 1) {
      return false;
    }
    return BigNumber.from(keys[0]).toHexString() === BUILDINGS_BUILT_SELECTOR;
  }

  eventName(selector: string): string {
    const eventSelector = BigNumber.from(selector).toHexString();
    switch (eventSelector) {
      case BUILDINGS_BUILT_SELECTOR:
        return "BuildingBuilt";
      default:
        return "";
    }
  }

  async index(events: Event[]): Promise<void> {
    let lastIndexedEventId = await this.lastIndexId();
    for (const event of events) {
      const eventId = event.eventId;
      if (eventId <= lastIndexedEventId) {
        continue;
      }
      const params = event.parameters ?? [];
      const keys = event.keys ?? [];
      if (this.isBuildingBuiltEvent(keys)) {
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
    return;
  }

  async lastIndexId(): Promise<string> {
    const event = await this.context.prisma.event.findFirst({
      where: {
        contract: { in: this.contracts() },
        status: 2
      },
      orderBy: {
        eventId: "desc"
      }
    });
    return event?.eventId ?? "";
  }
}
