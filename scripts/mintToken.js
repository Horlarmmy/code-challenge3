const hre = require("hardhat");
const { encryptDataField, decryptNodeResponse } = require("@swisstronik/swisstronik.js");

const sendShieldedTransaction = async (signer, destination, data, value) => {
  const rpclink = hre.network.config.url;
  const [encryptedData] = await encryptDataField(rpclink, data);
  return await signer.sendTransaction({
    from: signer.address,
    to: destination,
    data: encryptedData,
    value,
  });
};

const sendShieldedQuery = async (provider, destination, data) => {
  const rpclink = hre.network.config.url;
  const [encryptedData, usedEncryptedKey] = await encryptDataField(rpclink, data);
  const response = await provider.call({
    to: destination,
    data: encryptedData,
  });
  return await decryptNodeResponse(rpclink, response, usedEncryptedKey);
};

const getBalance = async (signer, contractAddress, contract) => {
  const functionName = "balanceOf";
  const responseMessage = await sendShieldedQuery(signer.provider, contractAddress, contract.interface.encodeFunctionData(functionName, [signer.address]));
  return hre.ethers.formatEther(contract.interface.decodeFunctionResult(functionName, responseMessage)[0]);
}

async function main() {
  const contractAddress = "0xbeE78e505F7e36e1dBC37e2BE8C0Ae753478810B";
  const [signer] = await hre.ethers.getSigners();
  const contractFactory = await hre.ethers.getContractFactory("HorlarmmyToken");
  const contract = contractFactory.attach(contractAddress);
  let bal = await getBalance(signer, contractAddress, contract);
  console.log("Token Balance before minting:", bal, "HORT");
  const functionName = "mint";
  const mintTx = await sendShieldedTransaction(signer, contractAddress, contract.interface.encodeFunctionData(functionName, [signer.address, 100000000000000000000n]), 0);
  console.log("Minting 100 HORT to", signer.address)
  await mintTx.wait();
  console.log("Transaction Receipt: ", mintTx);
  bal = await getBalance(signer, contractAddress, contract);
  console.log("Token Balance after minting:", bal, "HORT");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});