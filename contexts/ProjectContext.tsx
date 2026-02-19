
import React, { createContext, useContext, ReactNode } from 'react';
import { Project, ProjectStatus, Task, Expense, WorkAssignment, ProjectFile, ProjectPhase, User, TeamMember, ChecklistTask, PaymentStage, Quotation } from '../types';

interface ProjectContextType {
    project: Project;
    isReadOnly: boolean;
    user: User;
    teamMembers: TeamMember[];
    quotations: Quotation[];

    // Actions
    onUpdateTasks: (tasks: Task[]) => void;
    onUpdateProgress: (progress: number) => void;
    onUpdateStatus: (status: ProjectStatus) => void;
    onAddComment: (text: string) => void;
    onDeleteComment: (commentId: string) => void;
    onUpdateExpenses: (expenses: Expense[]) => void;
    onUpdateWorkAssignments: (assignments: WorkAssignment[]) => void;
    onUpdatePreConstruction: (prep: any) => void;
    onUpdateFiles?: (files: ProjectFile[]) => void;
    onUpdatePhases?: (phases: ProjectPhase[]) => void;
    onAddDailyLog: (log: { content: string, photoUrls: string[] }) => void;
    onDeleteDailyLog: (logId: string) => void;
    onUpdateChecklist: (checklist: ChecklistTask[]) => void;
    onUpdatePayments: (payments: PaymentStage[]) => void;
    onUpdateContractUrl: (url: string) => void;
    onUpdateDefectRecords: (records: any[]) => void;
    onNavigateToQuotation: (projectId: string, quotationId?: string) => void;
    onDeleteQuotation?: (id: string) => void;
    onLossClick: (project: Project) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};

interface ProjectProviderProps extends ProjectContextType {
    children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children, ...props }) => {
    return (
        <ProjectContext.Provider value={props}>
            {children}
        </ProjectContext.Provider>
    );
};
