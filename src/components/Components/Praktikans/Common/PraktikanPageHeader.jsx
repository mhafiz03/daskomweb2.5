export default function PraktikanPageHeader({ title, actions = null, right = null }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
                <div className="rounded-depth-lg border border-depth bg-depth-card px-10 py-4 shadow-depth-sm">
                    <h6 className="text-lg font-semibold text-depth-primary">{title}</h6>
                </div>
                {actions}
            </div>
            {right ? <div className="flex flex-wrap items-center gap-2">{right}</div> : null}
        </div>
    );
}
