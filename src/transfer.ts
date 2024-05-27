import {Item, TransferHistory, User} from "../generated/schema";
import {URC721} from "../generated/NFTItem/URC721";
import {Transfer} from "../generated/NFTItem/URC4906";
import {ContractAddress} from "./const";

export function tokenTransfer(event: Transfer): void {
  /* load the token from the existing Graph Node */



  let token = Item.load(event.params.tokenId.toString())
  if (!token) {
    token = new Item(event.params.tokenId.toString())
    token.tokenID = event.params.tokenId
    token.tokenURI = ""
    let nftContract = URC721.bind(ContractAddress)
    let tokenURIResult = nftContract.try_tokenURI(token.tokenID)
    if (!tokenURIResult.reverted) {
      token.tokenURI = tokenURIResult.value;
    }
  }

  token.owner = event.params.to.toHexString()
  token.save()

  let user = User.load(event.params.to.toHexString())
  if (!user) {
    user = new User(event.params.to.toHexString())
    user.save()
  }

  // Store transfer as history
  let transferHistoryID = event.transaction.hash.toHexString().concat("-" + event.transactionLogIndex.toString())
  let transferHistory = TransferHistory.load(transferHistoryID)
  if (!transferHistory){
    // Should be here always
    transferHistory = new TransferHistory(transferHistoryID)
    transferHistory.from = event.params.from.toHexString()
    transferHistory.txHash = event.transaction.hash.toHexString()
    transferHistory.to = event.params.to.toHexString()
    transferHistory.tokenID = event.params.tokenId
    transferHistory.transferAt = event.block.timestamp

  }
}


