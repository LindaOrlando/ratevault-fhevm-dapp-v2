# RateVault - Privacy-Preserving Multi-Dimensional Rating dApp

RateVault is a privacy-preserving multi-dimensional rating dApp built on FHEVM technology. Users can submit encrypted ratings across multiple dimensions (design, usability, performance, etc.) while maintaining complete data privacy. The system leverages FHEVM's homomorphic encryption to perform calculations on encrypted data without revealing individual scores. Creators can decrypt aggregated statistics to view overall trends, while participants can only decrypt their own ratings.

## ✨ Features

- **🔐 Privacy-Preserving**: All ratings are encrypted using FHEVM technology
- **📊 Multi-Dimensional Rating**: Support for 2-10 custom rating dimensions
- **📈 Real-time Statistics**: Encrypted data visualization with charts and graphs
- **🔑 EIP-712 Signatures**: Secure decryption authorization mechanism
- **🌐 Dual Network Support**: Automatic switching between mock (local) and real FHEVM environments
- **🎨 Modern UI**: Glassmorphism design with responsive layout
- **⚡ Fast Development**: Hot reload and instant feedback during development

## 🏗️ Project Structure

```
zama_rating_0004/
├── fhevm-hardhat-template/     # Smart contract development
│   ├── contracts/              # Solidity contracts
│   ├── deploy/                 # Deployment scripts
│   ├── test/                   # Contract tests
│   └── deployments/            # Deployment artifacts
└── ratevault-frontend/         # Next.js frontend application
    ├── app/                    # App Router pages
    ├── components/             # React components
    ├── hooks/                  # Custom React hooks
    ├── fhevm/                  # FHEVM integration
    └── abi/                    # Generated ABI files
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MetaMask or other Web3 wallet
- Sepolia ETH for testnet deployment

### 1. Clone the Repository

```bash
git clone https://github.com/LindaOrlando/zama_rating_0004.git
cd zama_rating_0004
```

### 2. Install Dependencies

```bash
# Install contract dependencies
cd fhevm-hardhat-template
npm install

# Install frontend dependencies
cd ../ratevault-frontend
npm install
```

### 3. Local Development

#### Option A: Mock Mode (Recommended for Development)

```bash
# Terminal 1: Start Hardhat node
cd fhevm-hardhat-template
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat deploy --network localhost

# Terminal 3: Start frontend in mock mode
cd ratevault-frontend
npm run dev:mock
```

#### Option B: Sepolia Testnet

```bash
# Configure environment variables (in fhevm-hardhat-template)
npx hardhat vars set MNEMONIC "your mnemonic phrase"
npx hardhat vars set INFURA_API_KEY "your infura api key"

# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Start frontend for real network
cd ratevault-frontend
npm run dev
```

### 4. Open Application

Visit `http://localhost:3000` and connect your MetaMask wallet.

## 🔧 Configuration

### Network Configuration

The application automatically detects the network and switches between:

- **Hardhat (31337)**: Uses Mock FHEVM for instant development
- **Sepolia (11155111)**: Uses real FHEVM Relayer SDK for production testing

### Environment Variables

Required for Sepolia deployment:

```bash
# In fhevm-hardhat-template directory
npx hardhat vars set MNEMONIC "your twelve word mnemonic phrase"
npx hardhat vars set INFURA_API_KEY "your infura project api key"
```

## 📖 How It Works

### 1. Creating Ratings

Creators can set up rating projects with:
- Custom name and description
- 2-10 rating dimensions
- Score range (e.g., 0-100)
- Optional deadline

### 2. Submitting Ratings

Participants submit encrypted ratings:
- Values are encrypted using FHEVM before sending
- Individual ratings remain private
- Only aggregated statistics are accessible to creators

### 3. Viewing Statistics

- **Creators**: Can decrypt aggregated statistics across all participants
- **Participants**: Can decrypt only their own submitted ratings
- **Charts**: Bar charts, radar charts, and detailed tables for visualization

### 4. Privacy Protection

- All computations happen on encrypted data
- FHEVM ensures ratings cannot be reverse-engineered
- EIP-712 signatures provide secure decryption authorization

## 🛠️ Development

### Smart Contract Development

```bash
cd fhevm-hardhat-template

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy locally
npx hardhat deploy --network localhost

# Deploy to Sepolia
npx hardhat deploy --network sepolia
```

### Frontend Development

```bash
cd ratevault-frontend

# Start development server
npm run dev:mock  # For mock mode
npm run dev       # For real network

# Build for production
npm run build

# Generate ABI files
npm run genabi
```

### Testing

The project includes comprehensive tests:

- **Contract Tests**: Located in `fhevm-hardhat-template/test/`
- **Mock Environment**: Uses `@fhevm/mock-utils` for local testing
- **Integration Tests**: End-to-end testing with real FHEVM operations

## 📋 Contract Addresses

### Sepolia Testnet

- **RatingVault**: `0x82Bb920d4e28d12041c83F260B9AeDeF2BC5FAe8`

View on [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x82Bb920d4e28d12041c83F260B9AeDeF2BC5FAe8)

## 🔒 Security Features

- **FHEVM Encryption**: All ratings are encrypted end-to-end
- **Access Control**: Only authorized users can decrypt specific data
- **EIP-712 Signatures**: Secure, typed data signing for decryption requests
- **Input Validation**: Comprehensive validation on both frontend and contract
- **Reentrancy Protection**: Safe contract design patterns

## 🎨 Design System

The application uses a deterministic design system based on:
- **Style**: Glassmorphism with frosted glass effects
- **Colors**: Blue-Cyan-Teal palette for professional tech appearance
- **Typography**: Sans-serif fonts with 1.25 scaling ratio
- **Layout**: Sidebar navigation with responsive design
- **Components**: Medium rounded corners (8px) with subtle shadows

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](fhevm-hardhat-template/LICENSE) file for details.

## 🙏 Acknowledgments

- **Zama**: For providing FHEVM technology
- **Hardhat**: For excellent development tooling
- **Next.js**: For the powerful React framework
- **Recharts**: For beautiful data visualization

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/LindaOrlando/zama_rating_0004/issues) page
2. Create a new issue with detailed information
3. Include browser console logs and network details

---

**Built with ❤️ using FHEVM for privacy-preserving computations**
