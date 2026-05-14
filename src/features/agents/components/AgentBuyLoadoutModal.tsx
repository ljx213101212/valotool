import { useState } from 'react';
import { ConfigProvider, Modal, theme } from 'antd';
import { TACTICAL_DRAWER_Z_INDEX } from '@/features/tactical-panels/components/tacticalDrawerStyles';
import { tacticalModalStyles } from '@/features/tactical-panels/components/tacticalModalStyles';
import { SIDEARMS } from '@/features/weapons/config';
import { getWeaponDisplayIconUrl } from '@/features/weapons/weaponDisplayIconUrls';
import './AgentBuyLoadoutModal.less';

const TACTICAL_MODAL_Z = TACTICAL_DRAWER_Z_INDEX + 50;

const MODAL_ROOT_CLASS = 'agent-buy-loadout-modal';
const MODAL_WRAP_CLASS = 'agent-buy-loadout-modal-wrap';

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
};

export function AgentBuyLoadoutModal({ open, onClose }: AgentBuyLoadoutModalProps) {
  const [equippedSidearmName, setEquippedSidearmName] = useState<string>('classic');

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
                      aria-label={`${w.labelZh}${equipped ? '（已装备）' : ''}`}
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
                        <div className="agent-buy-loadout__weapon-pick__name">{w.labelZh}</div>
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
                {Array.from({ length: 12 }, (_, i) => (
                  <div
                    key={`primary-${i}`}
                    className="agent-buy-loadout__cell"
                    aria-label={`长枪 ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="agent-buy-loadout__lane agent-buy-loadout__lane--armor">
              <div className="agent-buy-loadout__lane-title">护甲</div>
              <div
                className="agent-buy-loadout__grid agent-buy-loadout__grid--armor"
                role="group"
                aria-label="护甲栏位"
              >
                {Array.from({ length: 3 }, (_, i) => (
                  <div
                    key={`armor-${i}`}
                    className="agent-buy-loadout__cell"
                    aria-label={`护甲 ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="agent-buy-loadout__bottom">
            <div className="agent-buy-loadout__abilities-head">技能</div>
            <div
              className="agent-buy-loadout__grid agent-buy-loadout__grid--abilities"
              role="group"
              aria-label="技能栏位"
            >
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={`ability-${i}`}
                  className="agent-buy-loadout__cell agent-buy-loadout__cell--ability"
                  aria-label={`技能 ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  );
}
