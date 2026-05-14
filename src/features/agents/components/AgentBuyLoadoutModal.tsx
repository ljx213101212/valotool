import { useMemo, useState, type CSSProperties } from 'react';
import { ConfigProvider, Modal, theme } from 'antd';
import {
  agentCatalogIdToAbilitySlug,
  BUY_ROW_ABILITY_ORDER,
  getAgentBuyRowAbilities,
  type AgentAbilitySlug,
  type BuyRowAbilitySlot,
} from '@/features/abilities/config';
import { getAbilityDisplayIconUrl } from '@/features/abilities/abilityDisplayIconUrls';
import { TACTICAL_DRAWER_Z_INDEX } from '@/features/tactical-panels/components/tacticalDrawerStyles';
import { tacticalModalStyles } from '@/features/tactical-panels/components/tacticalModalStyles';
import {
  ARMOR,
  PRIMARY_WEAPONS,
  SIDEARMS,
  type ArmorId,
  type PrimaryWeapon,
} from '@/features/weapons/config';
import {
  getArmorLabel,
  getWeaponLabel,
  weaponEquippedAriaSuffix,
  type WeaponLocale,
} from '@/features/weapons/localization';
import { getWeaponDisplayIconUrl } from '@/features/weapons/weaponDisplayIconUrls';
import './AgentBuyLoadoutModal.less';

const TACTICAL_MODAL_Z = TACTICAL_DRAWER_Z_INDEX + 50;

const MODAL_ROOT_CLASS = 'agent-buy-loadout-modal';
const MODAL_WRAP_CLASS = 'agent-buy-loadout-modal-wrap';

/** 与 `config.ts` 里 PRIMARY_WEAPONS 分段一致：列1=4、列2=4、列3=狙击3+机枪2 */
const PRIMARY_COLUMNS: readonly (readonly PrimaryWeapon[])[] = [
  PRIMARY_WEAPONS.slice(0, 4),
  PRIMARY_WEAPONS.slice(4, 8),
  PRIMARY_WEAPONS.slice(8, 13),
];

function primaryWeaponGridStyle(
  colIndex: number,
  rowInCol: number,
): CSSProperties {
  const col = colIndex + 1;
  if (colIndex <= 1) {
    const rowStart = 1 + rowInCol * 3;
    return { gridColumn: col, gridRow: `${rowStart} / span 3` };
  }
  // 第三列：前 3 格各 span 2；战神/奥丁各 span 3（与列 1、2 单格同高）
  if (rowInCol < 3) {
    const rowStart = 1 + rowInCol * 2;
    return { gridColumn: col, gridRow: `${rowStart} / span 2` };
  }
  const rowStart = rowInCol === 3 ? 7 : 10;
  return { gridColumn: col, gridRow: `${rowStart} / span 3` };
}

const modalTheme = {
  algorithm: theme.darkAlgorithm,
  components: {
    Modal: {
      contentBg: '#0f172a',
      headerBg: '#1e293b',
      footerBg: '#0f172a',
      titleColor: '#e2e8f0',
    },
  },
};

export type AgentBuyLoadoutModalProps = {
  open: boolean;
  onClose: () => void;
  /** 与 `agentsCatalog` 的 `id` 一致（如 `kay-o`）；缺省时按 Sova 展示技能栏。 */
  agentCatalogId?: string | null;
  /** 武器展示名语言；整 Modal 其它文案仍随产品语言单独做 i18n 时再接。 */
  weaponLocale?: WeaponLocale;
};

function emptyAbilityPurchases(): Record<BuyRowAbilitySlot, number> {
  return { Grenade: 0, Ability1: 0, Ability2: 0 };
}

function AgentBuyLoadoutAbilities({ agentSlug }: { agentSlug: AgentAbilitySlug }) {
  const buyRowAbilities = useMemo(() => getAgentBuyRowAbilities(agentSlug), [agentSlug]);
  const [abilityPurchases, setAbilityPurchases] = useState(emptyAbilityPurchases);

  return (
    <div
      className="agent-buy-loadout__grid agent-buy-loadout__grid--abilities"
      role="group"
      aria-label="技能栏位"
    >
      {buyRowAbilities.map((ability, index) => {
        const slot = BUY_ROW_ABILITY_ORDER[index];
        const purchased = abilityPurchases[slot];
        const max = ability.maxAmount;
        const full = purchased >= max;
        const iconSrc = getAbilityDisplayIconUrl(ability.displayIcon);
        return (
          <button
            key={slot}
            type="button"
            className={
              full
                ? 'agent-buy-loadout__ability-pick agent-buy-loadout__ability-pick--full'
                : 'agent-buy-loadout__ability-pick'
            }
            aria-label={`${ability.displayName}，已购 ${purchased} / ${max}`}
            onClick={() => {
              setAbilityPurchases((prev) => {
                const cur = prev[slot];
                if (cur >= max) return prev;
                return { ...prev, [slot]: cur + 1 };
              });
            }}
          >
            <div className="agent-buy-loadout__ability-pick__dots" aria-hidden>
              {Array.from({ length: max }, (_, i) => (
                <span
                  key={i}
                  className={
                    i < purchased
                      ? 'agent-buy-loadout__ability-dot agent-buy-loadout__ability-dot--filled'
                      : 'agent-buy-loadout__ability-dot'
                  }
                />
              ))}
            </div>
            <div className="agent-buy-loadout__ability-pick__icon-wrap">
              {iconSrc ? (
                <img
                  className="agent-buy-loadout__ability-pick__icon"
                  src={iconSrc}
                  alt=""
                  draggable={false}
                />
              ) : null}
            </div>
            <div className="agent-buy-loadout__ability-pick__meta">
              {full ? (
                <span className="agent-buy-loadout__ability-pick__full">已满</span>
              ) : null}
              <span className="agent-buy-loadout__ability-pick__name">{ability.displayName}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function AgentBuyLoadoutModal({
  open,
  onClose,
  agentCatalogId,
  weaponLocale = 'zh',
}: AgentBuyLoadoutModalProps) {
  const [equippedSidearmName, setEquippedSidearmName] = useState<string>('classic');
  const [equippedPrimaryName, setEquippedPrimaryName] = useState<string>('phantom');
  const [equippedArmorName, setEquippedArmorName] = useState<ArmorId>('light');

  const abilitySlug = useMemo(
    () => agentCatalogIdToAbilitySlug(agentCatalogId ?? 'sova'),
    [agentCatalogId],
  );

  return (
    <ConfigProvider theme={modalTheme}>
      <Modal
        title="购买装备"
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnClose
        centered
        width={880}
        zIndex={TACTICAL_MODAL_Z}
        rootClassName={MODAL_ROOT_CLASS}
        wrapClassName={MODAL_WRAP_CLASS}
        styles={tacticalModalStyles}
      >
        <div className="agent-buy-loadout" aria-label="购买装备布局（占位）">
          <div className="agent-buy-loadout__top">
            <div className="agent-buy-loadout__lane agent-buy-loadout__lane--sidearms">
              <div className="agent-buy-loadout__lane-title">短枪</div>
              <div
                className="agent-buy-loadout__grid agent-buy-loadout__grid--sidearms"
                role="group"
                aria-label="短枪栏位"
              >
                {SIDEARMS.map((w) => {
                  const equipped = equippedSidearmName === w.name;
                  const iconSrc = getWeaponDisplayIconUrl(w.displayIconMirror);
                  const label = getWeaponLabel(weaponLocale, w.name);
                  return (
                    <button
                      key={w.name}
                      type="button"
                      className={
                        equipped
                          ? 'agent-buy-loadout__weapon-pick agent-buy-loadout__weapon-pick--equipped'
                          : 'agent-buy-loadout__weapon-pick'
                      }
                      aria-pressed={equipped}
                      aria-label={`${label}${weaponEquippedAriaSuffix(weaponLocale, equipped)}`}
                      onClick={() => setEquippedSidearmName(w.name)}
                    >
                      <div className="agent-buy-loadout__weapon-pick__icon-wrap">
                        {iconSrc ? (
                          <img
                            className="agent-buy-loadout__weapon-pick__icon"
                            src={iconSrc}
                            alt=""
                            draggable={false}
                          />
                        ) : null}
                      </div>
                      <div className="agent-buy-loadout__weapon-pick__meta">
                        <div className="agent-buy-loadout__weapon-pick__price-row">
                          {equipped ? (
                            <span className="agent-buy-loadout__weapon-pick__owned">已拥有</span>
                          ) : (
                            <>
                              <span className="agent-buy-loadout__weapon-pick__credits" aria-hidden>
                                ¤
                              </span>
                              <span className="agent-buy-loadout__weapon-pick__price-num">
                                {w.price}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="agent-buy-loadout__weapon-pick__name">{label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="agent-buy-loadout__lane agent-buy-loadout__lane--primaries">
              <div className="agent-buy-loadout__lane-title">长枪</div>
              <div
                className="agent-buy-loadout__grid agent-buy-loadout__grid--primaries"
                role="group"
                aria-label="长枪栏位"
              >
                {PRIMARY_COLUMNS.map((col, colIndex) =>
                  col.map((w, rowInCol) => {
                    const equipped = equippedPrimaryName === w.name;
                    const iconSrc = getWeaponDisplayIconUrl(w.displayIconMirror);
                    const label = getWeaponLabel(weaponLocale, w.name);
                    const pickClass = [
                      'agent-buy-loadout__weapon-pick',
                      equipped ? 'agent-buy-loadout__weapon-pick--equipped' : '',
                      colIndex === 2 && rowInCol < 3
                        ? 'agent-buy-loadout__weapon-pick--primary-compact'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    return (
                      <button
                        key={w.name}
                        type="button"
                        className={pickClass}
                        style={primaryWeaponGridStyle(colIndex, rowInCol)}
                        aria-pressed={equipped}
                        aria-label={`${label}${weaponEquippedAriaSuffix(weaponLocale, equipped)}`}
                        onClick={() => setEquippedPrimaryName(w.name)}
                      >
                        <div className="agent-buy-loadout__weapon-pick__icon-wrap">
                          {iconSrc ? (
                            <img
                              className="agent-buy-loadout__weapon-pick__icon"
                              src={iconSrc}
                              alt=""
                              draggable={false}
                            />
                          ) : null}
                        </div>
                        <div className="agent-buy-loadout__weapon-pick__meta">
                          <div className="agent-buy-loadout__weapon-pick__price-row">
                            {equipped ? (
                              <span className="agent-buy-loadout__weapon-pick__owned">已拥有</span>
                            ) : (
                              <>
                                <span className="agent-buy-loadout__weapon-pick__credits" aria-hidden>
                                  ¤
                                </span>
                                <span className="agent-buy-loadout__weapon-pick__price-num">
                                  {w.price}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="agent-buy-loadout__weapon-pick__name">{label}</div>
                        </div>
                      </button>
                    );
                  }),
                )}
              </div>
            </div>

            <div className="agent-buy-loadout__lane agent-buy-loadout__lane--armor">
              <div className="agent-buy-loadout__lane-title">护甲</div>
              <div
                className="agent-buy-loadout__grid agent-buy-loadout__grid--armor"
                role="group"
                aria-label="护甲栏位"
              >
                {ARMOR.map((a) => {
                  const equipped = equippedArmorName === a.name;
                  const iconSrc =
                    getWeaponDisplayIconUrl(a.displayIcon) ??
                    getWeaponDisplayIconUrl(a.displayIconMirror);
                  const label = getArmorLabel(weaponLocale, a.name);
                  return (
                    <button
                      key={a.name}
                      type="button"
                      className={
                        equipped
                          ? 'agent-buy-loadout__weapon-pick agent-buy-loadout__weapon-pick--armor agent-buy-loadout__weapon-pick--equipped'
                          : 'agent-buy-loadout__weapon-pick agent-buy-loadout__weapon-pick--armor'
                      }
                      aria-pressed={equipped}
                      aria-label={`${label}${weaponEquippedAriaSuffix(weaponLocale, equipped)}`}
                      onClick={() => setEquippedArmorName(a.name)}
                    >
                      <div className="agent-buy-loadout__weapon-pick__icon-wrap">
                        {iconSrc ? (
                          <img
                            className="agent-buy-loadout__weapon-pick__icon agent-buy-loadout__weapon-pick__icon--armor"
                            src={iconSrc}
                            alt=""
                            draggable={false}
                          />
                        ) : null}
                      </div>
                      <div className="agent-buy-loadout__weapon-pick__meta">
                        <div className="agent-buy-loadout__weapon-pick__price-row">
                          {equipped ? (
                            <span className="agent-buy-loadout__weapon-pick__owned">已拥有</span>
                          ) : (
                            <>
                              <span className="agent-buy-loadout__weapon-pick__credits" aria-hidden>
                                ¤
                              </span>
                              <span className="agent-buy-loadout__weapon-pick__price-num">
                                {a.price}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="agent-buy-loadout__weapon-pick__name">{label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="agent-buy-loadout__bottom">
            <div className="agent-buy-loadout__abilities-head">技能</div>
            <AgentBuyLoadoutAbilities key={abilitySlug} agentSlug={abilitySlug} />
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  );
}
