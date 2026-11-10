// src/simulation/JobQueue.ts
// ============================================================================
// THE VIVARIUM — Job Queue for Subterranean Excavation & Backfill
// Coordinates aligned to OrganicTerrainData (75 cols x 32 rows, 32px, origin -1200, 0)
// ============================================================================

export type JobType = 'DIG' | 'FILL';
export type JobStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface GridCoord {
  cx: number;
  cy: number;
}

export interface Job {
  id: number | string;
  type: JobType;
  cell: GridCoord;
  targetCell?: GridCoord; // Alias for cell
  status: JobStatus;
  assignedWorkerId: string | null;
  workDuration: number;
  progress: number;
  createdAt: number;
}

export class JobQueue {
  private jobs: Job[] = [];
  private nextId = 1;

  pushJob(type: JobType, cell: GridCoord, workDuration?: number): Job {
    // Deduplicate jobs on same cell that are not finished
    const existing = this.jobs.find(
      (j) => j.cell.cx === cell.cx && j.cell.cy === cell.cy && j.status !== 'COMPLETED' && j.status !== 'CANCELLED'
    );
    if (existing) {
      if (existing.type !== type) {
        existing.type = type;
        existing.status = 'PENDING';
        existing.assignedWorkerId = null;
        existing.progress = 0;
        existing.workDuration = workDuration ?? (type === 'DIG' ? this.calculateDigDuration(cell.cy) : 2.0);
      }
      return existing;
    }

    const duration = workDuration ?? (type === 'DIG' ? this.calculateDigDuration(cell.cy) : 2.0);
    const id = this.nextId++;
    const job: Job = {
      id,
      type,
      cell: { cx: cell.cx, cy: cell.cy },
      targetCell: { cx: cell.cx, cy: cell.cy },
      status: 'PENDING',
      assignedWorkerId: null,
      workDuration: duration,
      progress: 0,
      createdAt: performance.now(),
    };
    this.jobs.push(job);
    return job;
  }

  enqueue(jobData: {
    id?: number | string;
    type: JobType;
    targetCell?: GridCoord;
    cell?: GridCoord;
    workDuration?: number;
    progress?: number;
  }): Job {
    const target = jobData.cell || jobData.targetCell || { cx: 0, cy: 0 };
    return this.pushJob(jobData.type, target, jobData.workDuration);
  }

  popJob(workerPosition: { x: number; y: number }): Job | null {
    const pendingJobs = this.jobs.filter((j) => j.status === 'PENDING');
    if (pendingJobs.length === 0) return null;

    let bestJob: Job | null = null;
    let minDistance = Infinity;

    for (const job of pendingJobs) {
      const dx = job.cell.cx * 32 - workerPosition.x;
      const dy = job.cell.cy * 32 - workerPosition.y;
      const dist = Math.hypot(dx, dy);
      if (dist < minDistance) {
        minDistance = dist;
        bestJob = job;
      }
    }

    if (bestJob) {
      bestJob.status = 'IN_PROGRESS';
    }
    return bestJob;
  }

  claimNearestJob(
    workerPosition: { x: number; y: number },
    workerId: string,
    isFillAllowed: boolean = true
  ): Job | null {
    const pendingJobs = this.jobs.filter((j) => {
      if (j.status !== 'PENDING') return false;
      if (j.type === 'FILL' && !isFillAllowed) return false;
      return true;
    });

    if (pendingJobs.length === 0) return null;

    let bestJob: Job | null = null;
    let minDistance = Infinity;

    for (const job of pendingJobs) {
      // World coordinates of cell center
      const worldCenter = {
        x: -1200 + job.cell.cx * 32 + 16,
        y: job.cell.cy * 32 + 16,
      };
      const dx = worldCenter.x - workerPosition.x;
      const dy = worldCenter.y - workerPosition.y;
      const dist = Math.hypot(dx, dy);

      if (dist < minDistance) {
        minDistance = dist;
        bestJob = job;
      }
    }

    if (bestJob) {
      bestJob.status = 'IN_PROGRESS';
      bestJob.assignedWorkerId = workerId;
    }
    return bestJob;
  }

  cancelJob(id: number | string): boolean {
    const job = this.jobs.find((j) => String(j.id) === String(id));
    if (job) {
      job.status = 'CANCELLED';
      job.assignedWorkerId = null;
      return true;
    }
    return false;
  }

  cancelJobByCell(cx: number, cy: number): boolean {
    const job = this.jobs.find(
      (j) => j.cell.cx === cx && j.cell.cy === cy && (j.status === 'PENDING' || j.status === 'IN_PROGRESS')
    );
    if (job) {
      job.status = 'CANCELLED';
      job.assignedWorkerId = null;
      return true;
    }
    return false;
  }

  completeJob(id: number | string): boolean {
    const job = this.jobs.find((j) => String(j.id) === String(id));
    if (job) {
      job.status = 'COMPLETED';
      job.progress = 1.0;
      return true;
    }
    return false;
  }

  getJobByCell(cx: number, cy: number): Job | null {
    return (
      this.jobs.find(
        (j) => j.cell.cx === cx && j.cell.cy === cy && (j.status === 'PENDING' || j.status === 'IN_PROGRESS')
      ) || null
    );
  }

  getPendingCount(): number {
    return this.jobs.filter((j) => j.status === 'PENDING').length;
  }

  getAllJobs(): Job[] {
    return [...this.jobs];
  }

  clear(): void {
    this.jobs = [];
  }

  private calculateDigDuration(cy: number): number {
    if (cy < 10) return 3.5;
    if (cy < 20) return 4.2;
    return 5.0;
  }
}
