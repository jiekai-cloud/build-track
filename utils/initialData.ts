export const initializeData = () => {
    try {
        const existingProjects = localStorage.getItem('bt_projects');
        const existingCustomers = localStorage.getItem('bt_customers');
        const existingTeam = localStorage.getItem('bt_team_members'); // Check for team members too

        // Define initialProjects inside the function or import it
        const initialProjects = [
            {
                id: '202601001',
                departmentId: 'DEPT-1',
                name: '台北信義室內裝修案',
                category: '室內裝修',
                source: 'BNI',
                client: '王先生',
                referrer: '網站預約',
                manager: '陳志明',
                startDate: '2026-01-10',
                endDate: '2026-05-30',
                createdDate: '2026-01-01',
                budget: 2500000,
                spent: 1200000,
                progress: 45,
                status: '施工中',
                tasks: [],
                phases: [],
                financials: {
                    labor: 35,
                    material: 45,
                    subcontractor: 15,
                    other: 5
                },
                expenses: [],
                workAssignments: [],
                files: [],
                dailyLogs: [],
                checklist: [],
                payments: []
            },
            {
                id: '202603001',
                departmentId: 'DEPT-1',
                name: '台中商業辦公室擴建',
                category: '室內裝修',
                source: '企業',
                client: '科技公司',
                referrer: '舊客介紹',
                manager: '林靜宜',
                startDate: '2026-02-15',
                endDate: '2026-08-20',
                createdDate: '2026-01-20',
                budget: 8800000,
                spent: 2100000,
                progress: 15,
                status: '施工中',
                tasks: [],
                phases: [],
                financials: {
                    labor: 25,
                    material: 55,
                    subcontractor: 15,
                    other: 5
                },
                expenses: [],
                workAssignments: [],
                files: [],
                dailyLogs: [],
                checklist: [],
                payments: []
            },
            {
                id: '202604001',
                departmentId: 'DEPT-1',
                name: '高雄住宅景觀工程',
                category: '景觀工程',
                source: '住宅',
                client: '李女士',
                referrer: '直客',
                manager: '郭俊宏',
                startDate: '2026-03-01',
                endDate: '2026-06-15',
                createdDate: '2026-02-15',
                budget: 1500000,
                spent: 0,
                progress: 0,
                status: '洽談中',
                tasks: [],
                phases: [],
                financials: {
                    labor: 40,
                    material: 30,
                    subcontractor: 20,
                    other: 10
                },
                expenses: [],
                workAssignments: [],
                files: [],
                dailyLogs: [],
                checklist: [],
                payments: []
            },
            {
                id: 'JW2601003',
                name: "樹林區三龍街24巷16號國為海砂屋頂補強工程",
                category: "補強工程",
                source: "JW",
                status: "洽談中",
                client: "邱金福",
                referrer: "",
                quotationManager: "余家慶",
                engineeringManager: "陳文凱",
                introducer: "",
                introducerFeeRequired: false,
                introducerFeeAmount: 0,
                budget: 0,
                progress: 0,
                startDate: "2026-01-05",
                endDate: "",
                address: "新北市樹林區三龍街24巷16號",
                location: {
                    address: "新北市樹林區三龍街24巷16號",
                    lat: 25.033,
                    lng: 121.5654
                },
                createdDate: "2026-01-05",
                expenses: [],
                workAssignments: [],
                files: [],
                dailyLogs: [],
                checklist: [],
                payments: [],
                history: [] // Add history if needed
            }
        ];

        if (!existingProjects || JSON.parse(existingProjects).length === 0) {
            localStorage.setItem('bt_projects', JSON.stringify(initialProjects));
        }

        // ... logic for other items (customers, etc.) ...

    } catch (error) {
        console.error("Failed to initialize data:", error);
    }
};
