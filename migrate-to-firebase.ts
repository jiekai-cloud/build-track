/**
 * 一次性遷移腳本：從 JSON 備份檔匯入資料到 Firebase Firestore
 * 用法：在瀏覽器專案中臨時引入並執行
 */
import { db } from './services/firebaseClient';
import { collection, doc, writeBatch } from 'firebase/firestore';
import * as fs from 'fs';

async function migrate() {
    const dataPath = process.argv[2];
    if (!dataPath) {
        console.error('Usage: npx tsx migrate-to-firebase.ts <path-to-backup.json>');
        process.exit(1);
    }

    const raw = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(raw);

    const collections: Record<string, any[]> = {
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

    for (const [colName, items] of Object.entries(collections)) {
        if (!items || items.length === 0) {
            console.log(`⏭  ${colName}: 0 items, skipping`);
            continue;
        }

        console.log(`📤 Uploading ${colName}: ${items.length} items...`);
        const BATCH_SIZE = 450;
        const colRef = collection(db, colName);

        for (let i = 0; i < items.length; i += BATCH_SIZE) {
            const chunk = items.slice(i, i + BATCH_SIZE);
            const batch = writeBatch(db);

            chunk.forEach((item: any) => {
                const id = item.id || `auto-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                const docRef = doc(colRef, id);
                // Deep clone to remove undefined values
                batch.set(docRef, JSON.parse(JSON.stringify(item)));
            });

            await batch.commit();
            console.log(`   ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} committed (${chunk.length} items)`);
        }
    }

    // Update sync metadata
    const metaRef = doc(collection(db, '_meta'), 'sync_info');
    const batch = writeBatch(db);
    batch.set(metaRef, {
        id: 'sync_info',
        lastModified: new Date().toISOString(),
        migratedFrom: 'supabase',
        migrationDate: new Date().toISOString()
    });
    await batch.commit();

    console.log('\n🎉 Migration complete!');

    // Summary
    console.log('\n📊 Summary:');
    for (const [colName, items] of Object.entries(collections)) {
        console.log(`   ${colName}: ${items.length} items`);
    }
}

migrate().catch(console.error);
