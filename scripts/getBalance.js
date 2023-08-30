const hre = require("hardhat");
const { encryptDataField, decryptNodeResponse } = require("@swisstronik/swisstronik.js");

const sendShieldedQuery = async (provider, destination, data) => {
  const rpclink = hre.network.config.url;
  const [encryptedData, usedEncryptedKey] = await encryptDataField(rpclink, data);
  const response = await provider.call({
    to: destination,
    data: encryptedData,
  });
  return await decryptNodeResponse(rpclink, response, usedEncryptedKey);
};

async function main() {
  const contractAddress = "0xbeE78e505F7e36e1dBC37e2BE8C0Ae753478810B";
  const [signer] = await hre.ethers.getSigners();
  const contractFactory = await hre.ethers.getContractFactory("HorlarmmyToken");
  const contract = contractFactory.attach(contractAddress);
  const functionName = "balanceOf";
  const responseMessage = await sendShieldedQuery(signer.provider, contractAddress, contract.interface.encodeFunctionData(functionName, [signer.address]));
  console.log("Account Balance:", hre.ethers.formatEther(contract.interface.decodeFunctionResult(functionName, responseMessage)[0]), "HORT");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
