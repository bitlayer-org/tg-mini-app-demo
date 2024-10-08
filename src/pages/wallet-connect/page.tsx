import { DisplayData } from '@/components/DisplayData/DisplayData';
import { Button, Cell, Link, List, Section } from '@telegram-apps/telegram-ui';
import {
  useAccount,
  useBalance,
  useConfig,
  useConnect,
  useDisconnect,
  useEstimateFeesPerGas,
  useReadContract,
  useWriteContract,
} from 'wagmi';
import { Address, encodeFunctionData, erc20Abi, formatUnits } from 'viem';
import { BTCIcon, USDTIcon } from './coins';
import { estimateGas } from 'wagmi/actions';
import { usePopup } from '@telegram-apps/sdk-react';

const usdtContract = '0xfe9f969faf8Ad72a83b761138bF25dE87eFF9DD2';
const zkContract = '0x36cAE7b6b0B68c4dDb2BBD3CDeE34fd56f948aAe';

function ERC20Approve({ address, balance }: { address?: Address; balance?: bigint }) {
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const { data: fees } = useEstimateFeesPerGas();
  const popup = usePopup();

  const handleClick = async () => {
    if (!address || !balance) {
      console.warn('Address or balance is not set');
      return;
    }

    const args = [zkContract, balance] as const;
    const functionName = 'approve';

    const gas = await estimateGas(config, {
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName,
        args,
      }),
      to: usdtContract,
      account: address,
    });

    popup.open({
      title: 'Approve',
      message:
        'You are about to approve USDT transfer to ZK contract. Please navigate to your wallet to confirm.',
    });

    await writeContractAsync({
      abi: erc20Abi,
      address: usdtContract,
      functionName,
      args,
      maxFeePerGas: fees?.maxFeePerGas,
      gas: gas,
      maxPriorityFeePerGas: fees?.maxPriorityFeePerGas,
    });
  };
  return <Button onClick={handleClick}>Approve</Button>;
}

function TokenList({ address }: { address?: Address }) {
  const { data: usdtBalance } = useReadContract({
    abi: erc20Abi,
    address: usdtContract,
    functionName: 'balanceOf',
    args: [address!],
  });

  const { data: btcBalance } = useBalance({
    address,
  });

  return (
    <Section header="Tokens" footer="ERC20 token balance is read from its contract.">
      <Cell
        before={<BTCIcon style={{ width: 42, height: 42 }} />}
        subtitle={btcBalance ? formatUnits(btcBalance.value, 18) : '--'}
      >
        BTC
      </Cell>
      <Cell
        before={<USDTIcon style={{ width: 42, height: 42 }} />}
        after={<ERC20Approve address={address} balance={usdtBalance} />}
        subtitle={usdtBalance ? formatUnits(usdtBalance, 6) : '--'}
      >
        USDT
      </Cell>
    </Section>
  );
}

export function WalletConnectPage() {
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, chain } = useAccount();

  const handleConnect = () => {
    console.log('connect', connectors);
    const connector = connectors.find((connector) => connector.id === 'walletConnect');
    if (!connector) {
      console.warn('Connector not found');
      return;
    }
    connect({ connector });
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const walletData = [
    { title: 'Address', value: address || '--' },
    {
      title: 'Chain',
      value: chain?.name || '--',
    },
  ];

  return (
    <List>
      <Section
        header="Wallet Connect"
        footer="You can connect your wallet in Telegram Mini App with WalletConnect."
      >
        <Cell>
          {!address && <Button onClick={handleConnect}>Connect</Button>}
          {address && (
            <Button onClick={handleDisconnect} style={{ backgroundColor: 'red' }}>
              Disconnect
            </Button>
          )}
        </Cell>
        <Cell>
          <Link>
            <a href="https://metamask.app.link">MetaMask</a>
          </Link>
        </Cell>
        <Cell>
          <Link>
            <a href="https://355c3409.bl-official-site-test.pages.dev">Bitlayer</a>
          </Link>
        </Cell>
      </Section>
      <DisplayData header={'Wallet Info'} rows={walletData} />
      <TokenList address={address} />
    </List>
  );
}
