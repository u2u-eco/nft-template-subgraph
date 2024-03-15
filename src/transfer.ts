import {Item, TransferHistory, User} from "../generated/schema";
import {TransferBatch, TransferSingle, URC1155} from "../generated/NFTItem/URC1155";
import {ZERO} from "./const";
import { fetchOrCreateUniceran, fetchOrCreateUniceranOwnerBalance } from "./utils";
import { log } from "@graphprotocol/graph-ts";

export function tokenTransfer(event: TransferSingle): void {
  let uniceran = fetchOrCreateUniceran(event.params.id.toString(), event.block.timestamp);

  let uniceranOwnerBalanceFrom = fetchOrCreateUniceranOwnerBalance(event.params.id.toString(), event.params.from.toHexString(), event.block.timestamp);
  let uniceranOwnerBalanceTo = fetchOrCreateUniceranOwnerBalance(event.params.id.toString(), event.params.to.toHexString(), event.block.timestamp);

  if (event.params.from == event.params.to) {
    return;
  }

  if (event.params.from.toHexString() != ZERO) {
    uniceranOwnerBalanceFrom.owner = event.params.from.toHexString();
    uniceranOwnerBalanceTo.owner = event.params.to.toHexString();
    log.info('balance: {} , address {} ', [uniceranOwnerBalanceTo.balance.toString(), uniceranOwnerBalanceTo.owner]);
    uniceranOwnerBalanceFrom.balance = uniceranOwnerBalanceFrom.balance.minus(event.params.value);
    if (event.params.to.toHexString() == ZERO) {
      uniceranOwnerBalanceFrom.burnQuantity = uniceranOwnerBalanceFrom.burnQuantity.plus(event.params.value);
    }
    uniceranOwnerBalanceTo.balance = uniceranOwnerBalanceTo.balance.plus(event.params.value);
    
    uniceranOwnerBalanceFrom.save();
    uniceranOwnerBalanceTo.save();
  } else {
    uniceranOwnerBalanceTo.owner = event.params.to.toHexString();
    uniceranOwnerBalanceTo.balance = uniceranOwnerBalanceTo.balance.plus(event.params.value);
    uniceran.balance = uniceran.balance.plus(event.params.value);
    const nftContract = URC1155.bind(event.address);
    let tokenURIResult = nftContract.try_uri(event.params.id);
    if (!tokenURIResult.reverted) {
      uniceran.tokenURI = tokenURIResult.value;
    }
    uniceranOwnerBalanceTo.save();
  }
  uniceran.save();

  // Store transfer as history
  let transferHistoryID = event.transaction.hash.toHexString().concat("-" + event.transactionLogIndex.toString())
  let transferHistory = TransferHistory.load(transferHistoryID)
  if (!transferHistory){
    // Should be here always
    transferHistory = new TransferHistory(transferHistoryID)
    transferHistory.from = event.params.from.toHexString()
    transferHistory.txHash = event.transaction.hash.toHexString()
    transferHistory.to = event.params.to.toHexString()
    log.info('token id: ', [event.params.id.toString()])
    transferHistory.tokenID = event.params.id
    transferHistory.transferAt = event.block.timestamp
    transferHistory.quantity = event.params.value
    transferHistory.save();
  }
}
export function tokenTransferBatch(event: TransferBatch): void {
  for (let i = 0; i < event.params.ids.length; i++) {
    let uniceran = fetchOrCreateUniceran(event.params.ids[i].toString(), event.block.timestamp);
    
    let uniceranOwnerBalanceFrom = fetchOrCreateUniceranOwnerBalance(event.params.ids[i].toString(), event.params.from.toHexString(), event.block.timestamp);
    let uniceranOwnerBalanceTo = fetchOrCreateUniceranOwnerBalance(event.params.ids[i].toString(), event.params.to.toHexString(), event.block.timestamp);
    
    if (event.params.from.toHexString() != ZERO) {
      uniceranOwnerBalanceFrom.owner = event.params.from.toHexString();
      uniceranOwnerBalanceTo.owner = event.params.to.toHexString();
      uniceranOwnerBalanceFrom.balance = uniceranOwnerBalanceFrom.balance.minus(event.params.values[i]);
      uniceranOwnerBalanceTo.balance = uniceranOwnerBalanceTo.balance.plus(event.params.values[i]);
      
      uniceranOwnerBalanceFrom.save();
      uniceranOwnerBalanceTo.save();
    } else {
      uniceranOwnerBalanceTo.owner = event.params.to.toHexString();
      uniceranOwnerBalanceTo.balance = uniceranOwnerBalanceTo.balance.plus(event.params.values[i]);
      const nftContract = URC1155.bind(event.address);
      let tokenURIResult = nftContract.try_uri(event.params.ids[i]);
      if (!tokenURIResult.reverted) {
        uniceran.tokenURI = tokenURIResult.value;
      }
      uniceranOwnerBalanceTo.save();
    }
    uniceran.save();
  // Store transfer as history
    let transferHistoryID = event.transaction.hash.toHexString().concat("-" + event.transactionLogIndex.toString())
    let transferHistory = TransferHistory.load(transferHistoryID)
    if (!transferHistory){
      // Should be here always
      transferHistory = new TransferHistory(transferHistoryID)
      transferHistory.from = event.params.from.toHexString()
      transferHistory.txHash = event.transaction.hash.toHexString()
      transferHistory.to = event.params.to.toHexString()
      transferHistory.tokenID = event.params.ids[i]
      transferHistory.transferAt = event.block.timestamp
      transferHistory.quantity = event.params.values[i]
      transferHistory.save()
    }
  }
}