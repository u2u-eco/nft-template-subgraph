import {tokenTransfer} from "./transfer";
import {MetadataUpdate, Transfer} from "../generated/NFTItem/URC4906";
import {metadataUpdate} from "./metadata";

export function handleTransfer(event: Transfer): void {
  tokenTransfer(event);
}

export function handleUpdateMetadata(event: MetadataUpdate): void {
  metadataUpdate(event);
}


