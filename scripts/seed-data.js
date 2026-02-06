require('dotenv').config();
const { sequelize, User, Land, Customer, Agent, Transaction, AgentLandAssignment } = require('../models');

const sampleData = {
    users: [
        { username: 'john_agent', email: 'john@gmpromoters.com', password: 'agent123', fullName: 'John Smith', role: 'agent' },
        { username: 'jane_staff', email: 'jane@gmpromoters.com', password: 'staff123', fullName: 'Jane Doe', role: 'staff' }
    ],

    agents: [
        { agentId: 'AGT-0001', name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@example.com', commissionPercent: 2.5, address: 'Mumbai', isActive: true },
        { agentId: 'AGT-0002', name: 'Priya Sharma', phone: '9876543211', email: 'priya@example.com', commissionPercent: 2.0, address: 'Delhi', isActive: true },
        { agentId: 'AGT-0003', name: 'Amit Patel', phone: '9876543212', email: 'amit@example.com', commissionPercent: 3.0, address: 'Ahmedabad', isActive: true }
    ],

    customers: [
        { customerId: 'CUST-00001', name: 'Suresh Reddy', phone: '9988776655', email: 'suresh@email.com', address: '123 Main St', city: 'Hyderabad', state: 'Telangana', idProofType: 'aadhar' },
        { customerId: 'CUST-00002', name: 'Lakshmi Devi', phone: '9988776656', email: 'lakshmi@email.com', address: '456 Park Ave', city: 'Chennai', state: 'Tamil Nadu', idProofType: 'pan' },
        { customerId: 'CUST-00003', name: 'Venkat Rao', phone: '9988776657', email: 'venkat@email.com', address: '789 Lake View', city: 'Bangalore', state: 'Karnataka', idProofType: 'passport' },
        { customerId: 'CUST-00004', name: 'Anita Gupta', phone: '9988776658', email: 'anita@email.com', address: '321 Hill Road', city: 'Pune', state: 'Maharashtra', idProofType: 'voter_id' }
    ],

    lands: [
        { landId: 'LAND-00001', location: 'Shamshabad, Hyderabad', areaSize: 2400, areaUnit: 'sqft', price: 4800000, surveyNumber: 'SY-123/A', landType: 'residential', status: 'available', description: 'Prime residential plot near airport' },
        { landId: 'LAND-00002', location: 'ECR, Chennai', areaSize: 3600, areaUnit: 'sqft', price: 7200000, surveyNumber: 'SY-456/B', landType: 'residential', status: 'available', description: 'Beach-facing premium plot' },
        { landId: 'LAND-00003', location: 'Whitefield, Bangalore', areaSize: 1200, areaUnit: 'sqft', price: 3600000, surveyNumber: 'SY-789/C', landType: 'residential', status: 'sold', description: 'IT hub location plot' },
        { landId: 'LAND-00004', location: 'Hinjewadi, Pune', areaSize: 5000, areaUnit: 'sqft', price: 12500000, surveyNumber: 'SY-321/D', landType: 'commercial', status: 'available', description: 'Commercial plot in IT park' },
        { landId: 'LAND-00005', location: 'Gachibowli, Hyderabad', areaSize: 1800, areaUnit: 'sqft', price: 5400000, surveyNumber: 'SY-654/E', landType: 'residential', status: 'reserved', description: 'Near financial district' },
        { landId: 'LAND-00006', location: 'OMR, Chennai', areaSize: 2.5, areaUnit: 'acres', price: 25000000, surveyNumber: 'SY-987/F', landType: 'agricultural', status: 'available', description: 'Agricultural land with water access' }
    ]
};

async function seedData() {
    try {
        console.log('Seeding sample data...\n');

        await sequelize.authenticate();
        console.log('✓ Database connected');

        // Create users
        for (const user of sampleData.users) {
            await User.create(user);
        }
        console.log('✓ Sample users created');

        // Create agents
        const agents = [];
        for (const agent of sampleData.agents) {
            const created = await Agent.create(agent);
            agents.push(created);
        }
        console.log('✓ Sample agents created');

        // Create customers
        const customers = [];
        for (const customer of sampleData.customers) {
            const created = await Customer.create(customer);
            customers.push(created);
        }
        console.log('✓ Sample customers created');

        // Create lands
        const lands = [];
        for (let i = 0; i < sampleData.lands.length; i++) {
            const landData = { ...sampleData.lands[i], primaryAgentId: agents[i % agents.length].id };
            const created = await Land.create(landData);
            lands.push(created);

            // Create assignment
            await AgentLandAssignment.create({
                landId: created.id,
                agentId: agents[i % agents.length].id,
                status: 'active'
            });
        }
        console.log('✓ Sample lands created');

        // Create sample transactions
        const soldLand = lands.find(l => l.status === 'sold');
        if (soldLand) {
            await Transaction.create({
                transactionId: 'TXN-20240101-0001',
                landId: soldLand.id,
                customerId: customers[0].id,
                agentId: agents[0].id,
                amount: soldLand.price,
                paymentMethod: 'bank_transfer',
                paymentType: 'full',
                transactionDate: new Date('2024-01-15'),
                receiptNumber: 'RCP-000001',
                status: 'completed',
                commissionAmount: (soldLand.price * agents[0].commissionPercent) / 100
            });

            await soldLand.update({ purchasedBy: customers[0].id });
        }
        console.log('✓ Sample transactions created');

        console.log('\n========================================');
        console.log('Sample data seeded successfully!');
        console.log('========================================\n');
        console.log('Test Accounts:');
        console.log('  Agent: john_agent / agent123');
        console.log('  Staff: jane_staff / staff123\n');

        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedData();
