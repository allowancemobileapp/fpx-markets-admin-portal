# **App Name**: MarketMind Admin

## Core Features:

- Dashboard Overview: Dashboard with key metrics like new user registrations, pending KYC, transaction counts, active trades, total platform users, and active strategy providers.
- User Listing: List all platform users with server-side search, filtering (kyc_status, is_active, trading_plan_id), and pagination.
- Detailed User Profile: Display detailed user profile page with all fields, wallets, transactions, trades, copy trading subscriptions, price alerts, and user preferences.
- KYC Status & Trading Plan Updates: Admins can update a user's kyc_status (VERIFIED, REJECTED) and trading_plan_id.
- Transaction Processing: Admins can process 'PENDING' deposits and withdrawals, updating transaction statuses and wallet balances.
- Instrument Management: Full CRUD operations for tradable instruments/symbols, including user-friendly input for market_hours (JSONB).
- User Sentiment summarizer: Use generative AI tool to summarize key points from a long list of user complaints. LLM reasons which comments are redundant.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to evoke trust and professionalism.
- Background color: Light gray (#F5F5F5) for a clean and modern look.
- Accent color: Purple (#7E57C2) to highlight interactive elements and important information.
- Clean and readable sans-serif font.
- Collapsible sidebar menu for easy navigation.
- Simple and clear icons to represent different sections and actions.