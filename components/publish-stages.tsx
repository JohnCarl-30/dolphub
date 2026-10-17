"use client";

import { useId, useState } from "react";

const STAGES = [
  {
    name: "Sign in",
    clause: "First, sign in with your PCU address.",
    note: "The live site keeps accounts to IT, CS and Computer Engineering. This mock skips the step.",
  },
  {
    name: "Add a project",
    clause: "Then add one project with a title.",
    note: "A page stays out of the showcase until it has one. A demo link and a source link are optional.",
  },
  {
    name: "Share the link",
    clause: "Last, share your one link anywhere.",
    note: "Resumes, Messenger, class chats: the same address every time.",
  },
] as const;

/** Three stages of publishing, driven by one real range input. */
export function PublishStages() {
  const [stage, setStage] = useState(0);
  const id = useId();
  const current = STAGES[stage];
  const passed = (stage / (STAGES.length - 1)) * 100;

  return (
    <section aria-labelledby={`${id}-heading`} className="bg-paper">
      <div className="grid min-h-[88svh] grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col justify-between px-margin py-10 lg:py-12">
          <h2 id={`${id}-heading`} key={stage} className="rise max-w-[14ch] text-words font-medium">
            {current.clause}
          </h2>
          <p key={`${stage}-note`} className="rise mt-8 max-w-[44ch] text-lede text-ink" style={{ "--i": 1 } as React.CSSProperties}>
            {current.note}
          </p>
        </div>
        <div className="flex items-center justify-center bg-white px-margin py-10">
          <StageFragment stage={stage} />
        </div>
      </div>
      <div className="px-margin pb-10 pt-6">
        <label htmlFor={`${id}-range`} className="sr-only">
          Publishing stage
        </label>
        <input
          id={`${id}-range`}
          type="range"
          min={0}
          max={STAGES.length - 1}
          step={1}
          value={stage}
          onChange={(event) => setStage(Number(event.target.value))}
          aria-valuetext={current.name}
          className="stages-range"
          style={{ "--passed": `${passed}%` } as React.CSSProperties}
        />
        <ol className="mt-4 flex justify-between text-note" aria-hidden="true">
          {STAGES.map((item, index) => (
            <li key={item.name} className={index === stage ? "font-medium text-ink" : "text-muted"}>
              {item.name}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** A true-size fragment of the product in the state the stage describes. */
function StageFragment({ stage }: { stage: number }) {
  const frame = "w-full max-w-[440px] border border-ink/15 bg-white text-ink";
  if (stage === 0) {
    return (
      <div data-ui key="sign-in" className={`${frame} rise p-5`}>
        <p className="text-sm font-medium">Sign in</p>
        <p className="mt-1 text-sm text-muted">Use your PCU email. We send a link, no password.</p>
        <p className="mt-4 text-xs uppercase tracking-wide text-muted">PCU email</p>
        <div className="mt-1 h-11 border border-ink/15 px-3 text-base leading-[2.75rem]">you@pcu.edu.ph</div>
        <div className="mt-3 flex h-11 items-center justify-center bg-ink text-sm font-medium text-white">
          Email me a sign-in link
        </div>
      </div>
    );
  }
  if (stage === 1) {
    return (
      <div data-ui key="project" className={`${frame} rise p-5`}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Projects</p>
          <p className="text-xs uppercase tracking-wide text-muted">Add project</p>
        </div>
        <fieldset className="mt-3 border border-ink/15 p-3">
          <legend className="px-1 text-xs uppercase tracking-wide text-muted">Project 1</legend>
          <div className="h-10 border border-ink px-3 text-base leading-10">OrgFair</div>
          <div className="mt-2 h-16 border border-ink/15 px-3 py-2 text-sm text-muted">
            A phone-sized directory of PCU student orgs with meeting rooms and join links.
          </div>
          <div className="mt-2 h-10 border border-ink/15 px-3 text-sm leading-10 text-muted">Demo https://</div>
        </fieldset>
        <div className="mt-3 flex h-11 items-center justify-center bg-ink text-sm font-medium text-white">
          Save
        </div>
      </div>
    );
  }
  return (
    <div data-ui key="share" className={`${frame} rise p-5`}>
      <p className="text-xs uppercase tracking-wide text-muted">Your link</p>
      <p className="mt-1 break-all text-xl font-medium">dolphub.tech/u/mira</p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="border border-ink bg-ink px-3 py-2 text-white">Copy link</span>
        <span className="border border-ink px-3 py-2">Open page</span>
      </div>
      <div className="mt-4 border border-ink/15 p-3">
        <p className="text-sm font-medium">Mira Santos</p>
        <p className="text-sm text-muted">BS Information Technology · OrgFair, Lost &amp; Found locker</p>
      </div>
    </div>
  );
}
