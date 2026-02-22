/**
 * 一次性遷移腳本：透過 Firestore REST API 將 JSON 備份匯入 Firebase
 * 用法：node migrate-to-firebase-rest.mjs <path-to-backup.json>
 */
import { readFileSync } from 'fs';

const PROJECT_ID = 'jiekai-engineering';
const API_KEY = 'AIzaSyDX_JM5UqCaqY0y9j3LhPe1b5hWtlRlQrk';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function createDocument(collectionName, docId, data) {
    const url = `${BASE_URL}/${collectionName}/${docId}?key=${API_KEY}`;

    // Convert JS object to Firestore document format
    const fields = {};
    for (const [key, value] of Object.entries(data)) {
        fields[key] = convertToFirestoreValue(value);
    }

    const body = { fields };

    const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to write ${collectionName}/${docId}: ${response.status} ${errText}`);
    }
    return true;
}

function convertToFirestoreValue(value) {
    if (value === null || value === undefined) return { nullValue: null };
    if (typeof value === 'string') return { stringValue: value };
    if (typeof value === 'number') {
        if (Number.isInteger(value)) return { integerValue: String(value) };
        return { doubleValue: value };
    }
    if (typeof value === 'boolean') return { booleanValue: value };
    if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value.map(v => convertToFirestoreValue(v))
            }
        };
    }
    if (typeof value === 'object') {
        const fields = {};
        for (const [k, v] of Object.entries(value)) {
            if (v !== undefined) {
                fields[k] = convertToFirestoreValue(v);
            }
        }
        return { mapValue: { fields } };
    }
    return { stringValue: String(value) };
}

async function migrate() {
    const dataPath = process.argv[2];
    if (!dataPath) {
        console.error('Usage: node migrate-to-firebase-rest.mjs <path-to-backup.json>');
        process.exit(1);
    }

    console.log(`📂 Reading backup from: ${dataPath}`);
    const raw = readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(raw);

    const collectionMap = {
        projects: data.projects || [],
        customers: data.customers || [],
        teamMembers: data.teamMembers || [],
        vendors: data.vendors || [],
        leads: data.leads || [],
        inventoryItems: data.inventory || [],
        inventoryLocations: data.locations || [],
        purchaseOrders: data.purchaseOrders || [],
        attendanceRecords: data.attendance || [],
        payrollRecords: data.payroll || [],
        approvalRequests: data.approvalRequests || [],
        approvalTemplates: data.approvalTemplates || [],
        activityLogs: (data.activityLogs || []).slice(0, 200),
        quotations: data.quotations || [],
        calendarEvents: data.calendarEvents || [],
    };

    let totalUploaded = 0;

    for (const [colName, items] of Object.entries(collectionMap)) {
        if (!items || items.length === 0) {
            console.log(`⏭  ${colName}: 0 items, skipping`);
            continue;
        }

        console.log(`📤 Uploading ${colName}: ${items.length} items...`);

        // Upload in parallel batches of 10
        const CONCURRENCY = 10;
        for (let i = 0; i < items.length; i += CONCURRENCY) {
            const chunk = items.slice(i, i + CONCURRENCY);
            const promises = chunk.map(item => {
                const id = item.id || `auto-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                return createDocument(colName, id, item).catch(err => {
                    console.error(`   ❌ Failed: ${colName}/${id}:`, err.message.slice(0, 100));
                    return false;
                });
            });
            await Promise.all(promises);
            totalUploaded += chunk.length;
            process.stdout.write(`   ✅ ${Math.min(i + CONCURRENCY, items.length)}/${items.length}\r`);
        }
        console.log(`   ✅ ${items.length}/${items.length} done`);
    }

    // Write sync metadata
    console.log('📝 Writing sync metadata...');
    await createDocument('_meta', 'sync_info', {
        id: 'sync_info',
        lastModified: new Date().toISOString(),
        migratedFrom: 'supabase',
        migrationDate: new Date().toISOString()
    });

    console.log(`\n🎉 Migration complete! Total: ${totalUploaded} documents uploaded.`);

    console.log('\n📊 Summary:');
    for (const [colName, items] of Object.entries(collectionMap)) {
        if (items.length > 0) console.log(`   ${colName}: ${items.length} items`);
    }
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
