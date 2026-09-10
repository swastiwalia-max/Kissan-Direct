/**
 * Reusable form field. Pass `icon` for a leading icon, `as="select"` or
 * `as="textarea"` to change the control, `options` when as="select".
 */
export function Field({
  label,
  error,
  icon: Icon,
  as = "input",
  options,
  id,
  ...rest
}) {
  const fieldId = id || rest.name;
  const control =
    as === "select" ? (
      <select id={fieldId} className="kd-select" {...rest}>
        {options?.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    ) : as === "textarea" ? (
      <textarea id={fieldId} className="kd-textarea" rows={4} {...rest} />
    ) : Icon ? (
      <div className="kd-input-wrap">
        <Icon size={16} className="kd-input-wrap__icon" />
        <input id={fieldId} className={`kd-input ${error ? "kd-input--error" : ""}`} {...rest} />
      </div>
    ) : (
      <input id={fieldId} className={`kd-input ${error ? "kd-input--error" : ""}`} {...rest} />
    );

  return (
    <div className="kd-field">
      {label && (
        <label className="kd-field__label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      {control}
      {error && <span className="kd-field__error">{error}</span>}
    </div>
  );
}

export default Field;
