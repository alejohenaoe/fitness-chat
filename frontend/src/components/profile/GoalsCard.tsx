import { formatKcal } from '../../utils/format';
import type { UserProfile } from '../../types';

/** Tarjeta oscura con la meta diaria y el reparto de macros (crear cuenta y Perfil). */
export const GoalsCard = ({ profile, note }: { profile: UserProfile; note?: string }) => (
  <div className="rounded-[20px] bg-ink p-[18px] text-paper">
    <div className="font-num text-[12.5px] font-semibold uppercase tracking-[.12em] text-night-muted">Meta diaria</div>
    <div className="num text-[66px] font-extrabold leading-[.86] tracking-[-.01em]">
      {formatKcal(profile.daily_calorie_target)}
      <small className="ml-1 text-[20px] font-semibold tracking-[.02em] text-night-muted">kcal</small>
    </div>
    <div className="mb-3 mt-4 flex h-2 gap-0.5 overflow-hidden rounded-lg" aria-hidden="true">
      <span className="bg-protein" style={{ flex: profile.protein_target_g * 4 }} />
      <span className="bg-carbs" style={{ flex: profile.carbs_target_g * 4 }} />
      <span className="bg-fat" style={{ flex: profile.fat_target_g * 9 }} />
    </div>
    <ul className="grid gap-2">
      {([['Proteína', 'bg-protein', profile.protein_target_g], ['Carbohidratos', 'bg-carbs', profile.carbs_target_g], ['Grasas', 'bg-fat', profile.fat_target_g]] as const).map(([label, color, grams]) => (
        <li key={label} className="flex items-baseline gap-2 text-[14.5px] text-night-text">
          <i className={`h-[9px] w-[9px] flex-none -translate-y-px rounded-full ${color}`} />
          {label}
          <span className="flex-1 -translate-y-1 border-b-[1.5px] border-dotted border-[#4A4D55]" />
          <span className="num text-lg font-semibold text-paper">{grams} g</span>
        </li>
      ))}
    </ul>
    {note && <p className="mt-3 text-[12.5px] text-night-muted">{note}</p>}
  </div>
);
