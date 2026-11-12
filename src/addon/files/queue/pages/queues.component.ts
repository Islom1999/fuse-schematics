import { DatePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslocoPipe } from '@jsverse/transloco'
import { UserService } from 'app/core/user/user.service'
import { AdminFeedbackService } from 'app/shared/services/admin-feedback.service'
import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { DrawerModule } from 'primeng/drawer'
import { InputNumberModule } from 'primeng/inputnumber'
import { MessageModule } from 'primeng/message'
import { SelectModule } from 'primeng/select'
import { TableLazyLoadEvent, TableModule } from 'primeng/table'
import { TagModule } from 'primeng/tag'
import { QueueAdminService } from '../common/queue-admin.service'
import {
  IQueueInfo,
  IQueueJob,
  IQueueOverview,
  QUEUE_CLEAN_STATUSES,
  QUEUE_JOB_STATUSES,
  QueueCleanStatus,
  QueueJobStatus,
} from '../common/queue.model'

const PAGE_SIZE = 20
const MINUTE_MS = 60_000

/**
 * Background queues: the counts of every queue, and the jobs of the chosen queue by state. Needs
 * `queue.read`. The retry, clean, pause and resume buttons show only with `queue.write`.
 */
@Component({
  selector: 'app-queues',
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    DrawerModule,
    InputNumberModule,
    MessageModule,
    SelectModule,
    TableModule,
    TagModule,
    TranslocoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './queues.component.html',
})
export class QueuesComponent {
  private readonly service = inject(QueueAdminService)
  private readonly feedback = inject(AdminFeedbackService)
  private readonly users = inject(UserService)

  protected readonly canRead = computed(() => this.users.hasPermission('queue.read'))
  protected readonly canWrite = computed(() => this.users.hasPermission('queue.write'))

  protected readonly overview = signal<IQueueOverview | null>(null)
  protected readonly loadingOverview = signal(false)
  protected readonly working = signal<string | null>(null)

  protected readonly selected = signal<string | null>(null)
  protected readonly status = signal<QueueJobStatus>('failed')
  protected readonly jobs = signal<IQueueJob[]>([])
  protected readonly jobCount = signal(0)
  protected readonly loadingJobs = signal(false)
  protected readonly first = signal(0)
  protected readonly pageSize = PAGE_SIZE

  protected readonly statusOptions = QUEUE_JOB_STATUSES.map((value) => ({ label: `admin.queue.statuses.${value}`, value }))
  protected readonly cleanOptions = QUEUE_CLEAN_STATUSES.map((value) => ({ label: `admin.queue.statuses.${value}`, value }))

  protected readonly job = signal<IQueueJob | null>(null)
  protected readonly jobOpen = signal(false)

  protected readonly cleanOpen = signal(false)
  protected readonly cleaning = signal(false)
  protected readonly cleanForm = new FormGroup({
    status: new FormControl<QueueCleanStatus>('completed', { nonNullable: true, validators: [Validators.required] }),
    /** In minutes; sent as milliseconds. 0 removes every job in that state. */
    olderThanMinutes: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
  })

  protected readonly selectedInfo = computed<IQueueInfo | null>(
    () => this.overview()?.queues.find((queue) => queue.name === this.selected()) ?? null,
  )

  constructor() {
    effect(() => {
      if (this.canRead()) this.loadOverview()
    })
  }

  protected refresh(): void {
    this.loadOverview()
    this.loadJobs()
  }

  protected select(name: string): void {
    this.selected.set(name)
    this.first.set(0)
    this.loadJobs()
  }

  protected changeStatus(status: QueueJobStatus): void {
    this.status.set(status)
    this.first.set(0)
    this.loadJobs()
  }

  protected onJobsPage(event: TableLazyLoadEvent): void {
    this.first.set(event.first ?? 0)
    this.loadJobs()
  }

  protected openJob(job: IQueueJob): void {
    this.job.set(job)
    this.jobOpen.set(true)
  }

  protected json(value: unknown): string {
    return value === null || value === undefined ? '' : JSON.stringify(value, null, 2)
  }

  protected count(queue: IQueueInfo, status: QueueJobStatus): number {
    return queue[status]
  }

  protected retry(job: IQueueJob): void {
    const queue = this.selected()
    if (!queue) return
    this.working.set(`retry:${job.id}`)
    this.service.retry(queue, job.id).subscribe({
      next: () => {
        this.working.set(null)
        this.jobOpen.set(false)
        this.feedback.success('admin.queue.retried')
        this.refresh()
      },
      error: (error: unknown) => {
        this.working.set(null)
        this.feedback.httpError(error)
      },
    })
  }

  protected togglePause(queue: IQueueInfo): void {
    const pause = !queue.paused
    const run = () => {
      this.working.set(`pause:${queue.name}`)
      const request = pause ? this.service.pause(queue.name) : this.service.resume(queue.name)
      request.subscribe({
        next: () => {
          this.working.set(null)
          this.feedback.success(pause ? 'admin.queue.pausedDone' : 'admin.queue.resumedDone')
          this.loadOverview()
        },
        error: (error: unknown) => {
          this.working.set(null)
          this.feedback.httpError(error)
        },
      })
    }
    if (pause) {
      this.feedback.confirm('admin.queue.pauseConfirm.title', 'admin.queue.pauseConfirm.message').subscribe(run)
    } else {
      run()
    }
  }

  protected openClean(): void {
    const status = this.status()
    const preset: QueueCleanStatus = status === 'active' ? 'completed' : status
    this.cleanForm.reset({ status: preset, olderThanMinutes: 0 })
    this.cleanOpen.set(true)
  }

  protected submitClean(): void {
    const queue = this.selected()
    if (!queue || this.cleanForm.invalid) return
    const { status, olderThanMinutes } = this.cleanForm.getRawValue()
    this.cleaning.set(true)
    this.service.clean(queue, { status, olderThanMs: Math.round(olderThanMinutes * MINUTE_MS) }).subscribe({
      next: ({ removed }) => {
        this.cleaning.set(false)
        this.cleanOpen.set(false)
        this.feedback.success('admin.queue.cleaned', { count: removed })
        this.refresh()
      },
      error: (error: unknown) => {
        this.cleaning.set(false)
        this.feedback.httpError(error)
      },
    })
  }

  private loadOverview(): void {
    this.loadingOverview.set(true)
    this.service.overview().subscribe({
      next: (overview) => {
        this.overview.set(overview)
        this.loadingOverview.set(false)
      },
      error: (error: unknown) => {
        this.loadingOverview.set(false)
        this.feedback.httpError(error)
      },
    })
  }

  private loadJobs(): void {
    const queue = this.selected()
    if (!queue) return
    this.loadingJobs.set(true)
    const page = Math.floor(this.first() / PAGE_SIZE) + 1
    this.service.jobs(queue, this.status(), page, PAGE_SIZE).subscribe({
      next: (result) => {
        this.jobs.set(Array.isArray(result.data) ? result.data : [])
        this.jobCount.set(Number(result.count ?? 0))
        this.loadingJobs.set(false)
      },
      error: (error: unknown) => {
        this.jobs.set([])
        this.jobCount.set(0)
        this.loadingJobs.set(false)
        this.feedback.httpError(error)
      },
    })
  }
}
