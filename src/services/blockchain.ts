import axios from "axios";

interface BlockscoutAPI {
  name: string;
  baseUrl: string;
}

const APIS: BlockscoutAPI[] = [
  { name: "Ethereum", baseUrl: "https://eth.blockscout.com/api/v2" },
  { name: "Flow EVM", baseUrl: "https://evm.flowscan.io/api/v2" },
  { name: "Rootstock", baseUrl: "https://rootstock.blockscout.com/api/v2" },
];

export class BlockchainService {
  async searchToken(symbol: string, chain?: string): Promise<any> {
    const apis = chain
      ? APIS.filter((api) => api.name.toLowerCase().includes(chain))
      : APIS;

    const results: any[] = [];

    for (const api of apis) {
      try {
        const response = await axios.get(
          `${api.baseUrl}/tokens?q=${symbol}&type=ERC-20`,
          { timeout: 5000 }
        );

        if (response.data.items && response.data.items.length > 0) {
          results.push({
            chain: api.name,
            tokens: response.data.items.slice(0, 3), // Top 3 results
          });
        }
      } catch (error) {
        console.error(`Error fetching from ${api.name}:`, error);
      }
    }

    return results;
  }

  async getTokenDetails(address: string, chain: string): Promise<any> {
    const api = APIS.find((a) => a.name.toLowerCase().includes(chain));
    if (!api) throw new Error("Chain not supported");

    try {
      const response = await axios.get(`${api.baseUrl}/tokens/${address}`);
      return { chain: api.name, ...response.data };
    } catch (error) {
      throw new Error(`Failed to fetch token details: ${error}`);
    }
  }

  async getMarketChart(chain: string = "ethereum"): Promise<any> {
    const api = APIS.find((a) => a.name.toLowerCase().includes(chain)) || APIS[0];

    try {
      const response = await axios.get(`${api.baseUrl}/stats/charts/market`);
      return {
        chain: api.name,
        chart_data: response.data.chart_data?.slice(-7) || [], // Last 7 days
        available_supply: response.data.available_supply,
      };
    } catch (error) {
      throw new Error(`Failed to fetch market chart: ${error}`);
    }
  }

  formatTokenResponse(results: any[]): string {
    if (results.length === 0) {
      return "No tokens found for that symbol.";
    }

    let response = "🔍 **Token Search Results:**\n\n";

    results.forEach((chainResult) => {
      response += `**${chainResult.chain}:**\n`;
      chainResult.tokens.forEach((token: any, index: number) => {
        response += `${index + 1}. **${token.name}** (${token.symbol})\n`;
        response += `   💰 Price: $${token.exchange_rate || "N/A"}\n`;
        response += `   👥 Holders: ${token.holders_count || "N/A"}\n`;
        response += `   📊 24h Volume: $${token.volume_24h || "N/A"}\n`;
        response += `   📍 \`${token.address}\`\n\n`;
      });
    });

    return response;
  }

  formatChartResponse(chartData: any): string {
    let response = `📈 **${chartData.chain} Market Chart (Last 7 Days):**\n\n`;
    
    if (chartData.available_supply) {
      response += `💎 **Supply:** ${parseFloat(chartData.available_supply).toLocaleString()}\n\n`;
    }

    chartData.chart_data.forEach((day: any) => {
      response += `**${day.date}:** $${day.closing_price}\n`;
    });

    return response;
  }
}

export const blockchainService = new BlockchainService();