package slack

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"
)

// ValidateWebhookURL validates that the URL is a structurally correct Slack
// incoming webhook endpoint. Uses parsed URL to catch path-traversal bypasses
// that a raw string prefix check would miss.
func ValidateWebhookURL(raw string) error {
	u, err := url.Parse(raw)
	if err != nil {
		return fmt.Errorf("invalid webhook URL: %w", err)
	}
	if u.Scheme != "https" || u.Host != "hooks.slack.com" {
		return fmt.Errorf("webhook URL must use https://hooks.slack.com (got %s://%s)", u.Scheme, u.Host)
	}
	if !strings.HasPrefix(u.EscapedPath(), "/services/") {
		return fmt.Errorf("webhook URL path must start with /services/")
	}
	return nil
}

// PostWebhook sends a JSON payload to a Slack incoming webhook URL.
// Returns an error if the URL is not a valid Slack webhook, the request fails,
// or Slack returns a non-2xx status.
func PostWebhook(ctx context.Context, webhookURL, body string) error {
	if err := ValidateWebhookURL(webhookURL); err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, webhookURL, bytes.NewBufferString(body))
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("slack post: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("slack returned status %d", resp.StatusCode)
	}
	return nil
}
